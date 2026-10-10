import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { geminiJson } from "@/lib/gemini";

export const runtime = "nodejs";

const GEMINI_KEY = () => process.env.GOOGLE_AI_API_KEY || "";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "fill-from-description", 5, 60_000);
  if (limited) return limited;

  const { description } = await req.json().catch(() => ({}));
  if (!description?.trim()) return NextResponse.json({ error: "description is required" }, { status: 400 });
  if (!GEMINI_KEY()) return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });

  const prompt = `You are a startup consulting agent helping pre-fill a software project scope form.

The client described their app in a few sentences:

"${description.trim()}"

Based only on what they wrote, return a JSON object with EXACTLY these string keys:

{
  "company": "Company or product name if mentioned, otherwise empty string",
  "vertical": "One-line business type e.g. 'B2B SaaS — field service' or 'Marketplace — freelance platform'",
  "goal": "The primary outcome they want from this software — rewrite in terms of business impact (1–2 sentences)",
  "bottleneck": "The core operational problem or gap their description implies (1–2 sentences, specific)",
  "workflow": "The main workflow this app needs to handle — describe the full flow step by step (2–3 sentences)",
  "musthaves": "Comma-separated list of 4–6 must-have features inferred from their description",
  "integrations": "Comma-separated list of tools or platforms likely needed based on the app type"
}

Be specific and faithful to their description. Infer missing detail from context — do not add features they didn't imply. Return ONLY valid JSON, no markdown fences.`;

  const result = await geminiJson(prompt);
  if (!result.ok || !result.json) {
    return NextResponse.json({ error: `Couldn't read that — ${result.message}` }, { status: 502 });
  }
  return NextResponse.json(result.json);
}
