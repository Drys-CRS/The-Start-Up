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
    const html = await res.text();
    return stripHtml(html);
  } catch {
    return "";
  }
}

async function geminiFlash(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY()}`,
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
}

export async function POST(req: NextRequest) {
  const { domain } = await req.json().catch(() => ({}));
  if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 });
  if (!GEMINI_KEY()) return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });

  const siteText = await fetchSiteText(domain.trim());

  const prompt = `You are a startup consulting agent helping pre-fill a software project scope form.

${siteText
  ? `Here is text scraped from the website "${domain}":\n\n${siteText}`
  : `The domain is "${domain}" — the website could not be fetched, so infer from the domain name alone.`}

Based on this, return a JSON object with EXACTLY these keys (all strings, no arrays):

{
  "company": "Company name extracted from the site (or infer from domain)",
  "vertical": "One-line business type, e.g. 'Real estate agency' or 'B2B SaaS company'",
  "goal": "What outcome this business likely wants from a custom software build (1–2 sentences, specific and ambitious)",
  "bottleneck": "Their most likely operational bottleneck right now (1–2 sentences, honest and specific)",
  "workflow": "The core business workflow that most needs automating — describe the full flow step by step (2–3 sentences)",
  "musthaves": "Comma-separated list of 4–6 must-have software features for this vertical and business type",
  "integrations": "Comma-separated list of tools/platforms they likely already use or need to connect to"
}

Be specific to THEIR business, not generic. Return ONLY valid JSON.`;

  try {
    const raw = await geminiFlash(prompt);
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  }
}
