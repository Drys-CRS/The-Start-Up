import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

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
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

  const siteText = await fetchSiteText(domain.trim());
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  }
}
