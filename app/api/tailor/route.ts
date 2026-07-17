import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createItem, addUpdateToItem, LEADS, LEADS_BOARD_ID, today } from "@/lib/monday";

export const runtime = "nodejs";

// Personalises the homepage from a free-text business description and captures the
// enquiry to Monday.com. The AI classifies the sector and generates tailored hero copy,
// pipeline stages, sample leads, and "how we'd help" points. The raw description + the
// tailored result are saved as an update on the Monday lead item created from the query.
// Model call cascades through whichever provider is configured in the environment, so
// tailoring works with the keys the rest of the app already uses in production:
//   1. Vercel AI Gateway  (AI_GATEWAY_API_KEY or the auto-injected VERCEL_OIDC_TOKEN)
//   2. OpenRouter         (OPENROUTER_API_KEY — same key that powers the Bottleneck Report)
//   3. Google Gemini      (GOOGLE_AI_API_KEY — same key that powers Build-Plan auto-fill)
const GATEWAY_KEY = () => process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || "";
const GATEWAY_MODEL = process.env.TAILOR_MODEL || "anthropic/claude-haiku-4.5";
const OPENROUTER_MODEL = process.env.TAILOR_MODEL_OPENROUTER || "anthropic/claude-3.5-haiku";
const GEMINI_MODEL = process.env.TAILOR_MODEL_GEMINI || "gemini-2.5-flash";

function isConfigured(): boolean {
  return !!(GATEWAY_KEY() || process.env.OPENROUTER_API_KEY || process.env.GOOGLE_AI_API_KEY);
}

// One OpenAI-compatible chat call (used for both the AI Gateway and OpenRouter).
async function openAiCompatible(
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
  extraHeaders: Record<string, string> = {},
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function gemini(prompt: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.5 },
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

// Try each configured provider in order; return the first non-empty completion.
async function callModel(prompt: string): Promise<string | null> {
  const gwKey = GATEWAY_KEY();
  if (gwKey) {
    const t = await openAiCompatible("https://ai-gateway.vercel.sh/v1/chat/completions", gwKey, GATEWAY_MODEL, prompt);
    if (t) return t;
  }
  if (process.env.OPENROUTER_API_KEY) {
    const t = await openAiCompatible(
      "https://openrouter.ai/api/v1/chat/completions",
      process.env.OPENROUTER_API_KEY,
      OPENROUTER_MODEL,
      prompt,
      { "HTTP-Referer": "https://tsu.agency", "X-Title": "The Start Up — Tailor" },
    );
    if (t) return t;
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    const t = await gemini(prompt);
    if (t) return t;
  }
  return null;
}

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
    { "title": "3-5 word capability", "body": "one concise sentence on how we'd solve a specific problem for their sector" }
  ]
}

Rules:
- "leads" MUST contain EXACTLY 5 objects; vary heat and staleness realistically. Keep every string short.
- "help" MUST contain EXACTLY 3 objects, concrete to their sector (not generic).
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
  if (!isConfigured()) {
    return NextResponse.json({ error: "Tailoring isn't configured yet." }, { status: 503 });
  }

  const completion = await callModel(buildPrompt(desc.slice(0, 1500)));
  const tailored: any = normalise(safeParse(completion || ""));

  // Capture the lead without blocking the response: waitUntil keeps the function alive
  // until the Monday writes finish (guaranteed on Fluid Compute), so the visitor gets their
  // tailored result immediately while the two Monday round-trips complete in the background.
  waitUntil(captureLead(desc, tailored));

  if (!tailored) {
    return NextResponse.json(
      { error: "Couldn't tailor the page just now — please try again." },
      { status: 502 },
    );
  }
  return NextResponse.json({ tailored });
}

// Best-effort lead capture. Runs detached from the response; failures are swallowed.
async function captureLead(desc: string, tailored: any): Promise<void> {
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
    // swallow — lead capture must never affect the visitor experience
  }
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
