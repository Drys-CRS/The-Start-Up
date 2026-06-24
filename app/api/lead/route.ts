import { NextRequest, NextResponse } from "next/server";
import { createItem, LEADS, LEADS_BOARD_ID, today } from "@/lib/monday";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b || !/.+@.+\..+/.test(b.email || "")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const columnValues: Record<string, unknown> = {
    [LEADS.email]: { email: b.email, text: b.email },
    [LEADS.industry]: b.industry || "Other",
    [LEADS.leads]: String(b.leads ?? 0),
    [LEADS.deal]: String(b.deal ?? 0),
    [LEADS.closeRate]: String(b.closeRate ?? 0),
    [LEADS.response]: b.responseTime || "Unknown",
    [LEADS.leak]: String(Math.round(b.annualLeak ?? 0)),
    [LEADS.currency]: b.currency || "USD",
    [LEADS.source]: "Lead Leakage Calculator",
    [LEADS.captured]: { date: today() },
    [LEADS.stage]: { label: "New Lead" },
  };
  try {
    const id = await createItem(LEADS_BOARD_ID, b.company || b.email, columnValues);
    return NextResponse.json({ ok: true, itemId: id });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not save lead", detail: String(e?.message || e) }, { status: 502 });
  }
}
