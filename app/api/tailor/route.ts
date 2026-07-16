import { NextRequest, NextResponse } from "next/server";
import { createItem, addUpdateToItem, LEADS, LEADS_BOARD_ID, today } from "@/lib/monday";

export const runtime = "nodejs";

// Personalises the homepage from a free-text business description and captures the
// enquiry to Monday.com. The AI classifies the sector and generates tailored hero copy,
// pipeline stages, sample leads, and "how we'd help" points. The raw description + the
// tailored result are saved as an update on the Monday lead item created from the query.
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
// Confirmed valid AI Gateway slug; override with TAILOR_MODEL if desired.
const MODEL = process.env.TAILOR_MODEL || "anthropic/claude-haiku-4.5";
// On Vercel the AI Gateway also accepts the auto-injected OIDC token, so deployed
// functions need no explicit key. Locally, `vercel env pull` / `vercel dev` provide it,
// or set AI_GATEWAY_API_KEY directly.
const KEY = () => process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || "";

function buildPrompt(description: string): string {
  return `You are a senior solutions consultant at "The Start Up", a firm that builds custom CRM / pipeline systems and AI automation for process-driven businesses, shipped in 30 days.

A prospective client described their business:

"""
${description}
"""

Tailor our landing page to their sector. Respond with ONLY valid JSON (no markdown fences, no preamble), matching EXACTLY this shape:

{
  "sector": "2-4 word label for their business type, e.g. 'Dental Practice' or 'Recruitment Agency'",
  "eyebrow": "short phrase under 10 words, framed like 'For {sector} teams whose CRM isn't running the pipeline'",
  "tagline": "one benefit-focused sentence, specific to their described business and its likely pain",
  "stages": ["exactly 3 pipeline stage names for how THIS business wins work, entry -> mid -> won, each 1-2 words"],
  "leads": [
    { "company": "realistic sample client/deal name for their sector", "value": "$ amount with unit that fits (e.g. '$24k /yr', '$320 /visit', '$650k')", "heat": "hot | warm | cold", "stale": "Nd untouched (a small number of days)" }
  ],
  "help": [
    { "title": "3-5 word capability", "body": "one sentence on how we'd solve a specific problem for their sector" }
  ]
}

Rules:
- "leads" MUST contain EXACTLY 5 objects; vary heat and staleness realistically.
- "help" MUST contain EXACTLY 4 objects, concrete to their sector (not generic).
- Be faithful to what they wrote; infer sensibly, invent nothing they'd find irrelevant.
- No flattery. Return ONLY the JSON object.`;
}

function safeParse(text: string): any | null {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to the first {...} block if the model added stray text.
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { return null; } }
    return null;
  }
}

// Coerce the model output into the exact shape the page expects, with hard guards so a
// slightly-off response never breaks the UI.
function normalise(raw: any): any | null {
  if (!raw || typeof raw !== "object") return null;
  const str = (v: any, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const sector = str(raw.sector, 40);
  const eyebrow = str(raw.eyebrow, 120);
  const tagline = str(raw.tagline, 240);
  if (!sector || !tagline) return null;

  const stagesArr = Array.isArray(raw.stages) ? raw.stages.map((s: any) => str(s, 24)).filter(Boolean) : [];
  const stages = stagesArr.length === 3 ? stagesArr : null;

  const ids = ["a", "b", "c", "d", "e"];
  const heats = new Set(["hot", "warm", "cold"]);
  const leadsArr = Array.isArray(raw.leads)
    ? raw.leads.slice(0, 5).map((l: any, i: number) => ({
        id: ids[i],
        company: str(l?.company, 40) || `Lead ${i + 1}`,
        value: str(l?.value, 24) || "$—",
        heat: heats.has(l?.heat) ? l.heat : "warm",
        stale: str(l?.stale, 24) || `${i + 2}d untouched`,
      }))
    : [];
  const leads = leadsArr.length === 5 ? leadsArr : null;

  const help = Array.isArray(raw.help)
    ? raw.help
        .slice(0, 4)
        .map((h: any) => ({ title: str(h?.title, 48), body: str(h?.body, 200) }))
        .filter((h: any) => h.title && h.body)
    : [];

  return { sector, eyebrow: eyebrow || `For ${sector} teams`, tagline, stages, leads, help };
}

export async function POST(req: NextRequest) {
  const { description } = await req.json().catch(() => ({}));
  const desc = String(description || "").trim();
  if (desc.length < 8) {
    return NextResponse.json({ error: "Tell us a little more about your business." }, { status: 400 });
  }
  if (!KEY()) {
    return NextResponse.json({ error: "Tailoring isn't configured yet." }, { status: 503 });
  }

  let tailored: any = null;
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1100,
        temperature: 0.5,
        messages: [{ role: "user", content: buildPrompt(desc.slice(0, 1500)) }],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      tailored = normalise(safeParse(data.choices?.[0]?.message?.content || ""));
    }
  } catch {
    // network / provider error — handled below
  }

  // Best-effort capture to Monday. Never blocks or fails the response (token is prod-only).
  try {
    const name = (tailored?.sector || desc.slice(0, 60)) || "Website enquiry";
    const itemId = await createItem(LEADS_BOARD_ID, name, {
      [LEADS.industry]: tailored?.sector || "Other",
      [LEADS.source]: "Homepage — Business Tailor",
      [LEADS.captured]: { date: today() },
      [LEADS.stage]: { label: "New Lead" },
    });
    await addUpdateToItem(itemId, formatUpdate(desc, tailored));
  } catch {
    // swallow — lead capture is best-effort and must not affect the visitor experience
  }

  if (!tailored) {
    return NextResponse.json(
      { error: "Couldn't tailor the page just now — please try again." },
      { status: 502 },
    );
  }
  return NextResponse.json({ tailored });
}

function formatUpdate(description: string, tailored: any): string {
  const lines = [`📝 Business described on homepage:`, description, ""];
  if (tailored) {
    lines.push(`🎯 Tailored to sector: ${tailored.sector}`);
    if (tailored.tagline) lines.push(`Tagline: ${tailored.tagline}`);
    if (Array.isArray(tailored.stages)) lines.push(`Pipeline: ${tailored.stages.join(" → ")}`);
    if (Array.isArray(tailored.help) && tailored.help.length) {
      lines.push("", "How we'd help:");
      for (const h of tailored.help) lines.push(`• ${h.title} — ${h.body}`);
    }
  } else {
    lines.push("(AI tailoring was unavailable for this enquiry.)");
  }
  return lines.join("\n");
}
