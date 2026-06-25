import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_KEY = () => process.env.GOOGLE_AI_API_KEY || "";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);
}

async function fetchSiteText(domain: string): Promise<string> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ScopeLockBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    return stripHtml(await res.text());
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const { domain } = await req.json().catch(() => ({}));
  if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 });
  if (!GEMINI_KEY()) return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });

  const siteText = await fetchSiteText(domain.trim());

  const prompt = `You are a startup consulting agent helping pre-fill a software project scope form.

${siteText
    ? `Here is text scraped from the website "${domain}":\n\n${siteText}`
    : `The domain is "${domain}" — the site could not be fetched, so infer from the domain name alone.`}

Return a JSON object with EXACTLY these string keys (no arrays):

{
  "company": "Company name from the site or inferred from domain",
  "vertical": "One-line business type e.g. 'B2B SaaS — HR software' or 'Real estate agency'",
  "goal": "What outcome this business likely wants from a custom software build (1–2 sentences, specific)",
  "bottleneck": "Their most likely operational bottleneck right now (1–2 sentences, honest)",
  "workflow": "The core business workflow most needing automation — describe the full flow step by step (2–3 sentences)",
  "musthaves": "Comma-separated list of 4–6 must-have software features for this vertical",
  "integrations": "Comma-separated list of tools/platforms they likely use or need to connect"
}

Be specific to THEIR business. Return ONLY valid JSON, no markdown fences.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
        }),
      },
    );
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  }
}
