import { NextRequest, NextResponse } from "next/server";
import { runMvpAgent } from "@/lib/agent/mvp-agent";

export const runtime = "nodejs";
// Agent runs long — Vercel Pro allows 300s; hobby is capped at 60s
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { scopeLockItemId } = await req.json().catch(() => ({}));

  if (!scopeLockItemId) {
    return NextResponse.json({ error: "scopeLockItemId is required" }, { status: 400 });
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const result = await runMvpAgent(scopeLockItemId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("MVP agent error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
