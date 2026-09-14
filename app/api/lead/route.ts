import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { waitUntil } from "@vercel/functions";
import { sendTeamAlert } from "@/lib/email";
import { mondayBoardUrl } from "@/lib/links";
import { createItem, LEADS, LEADS_BOARD_ID, today } from "@/lib/monday";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "lead", 10, 60_000);
  if (limited) return limited;

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
    waitUntil(
      sendTeamAlert({
        subject: `New calculator lead: ${b.company || b.email}`,
        heading: "A new lead ran the Lead Leakage Calculator",
        rows: [
          ["Company", b.company],
          ["Email", b.email],
          ["Industry", b.industry],
          ["Monthly leads", b.leads],
          ["Avg deal value", b.deal],
          ["Close rate %", b.closeRate],
          ["Response time", b.responseTime],
          ["Est. annual leak", Math.round(b.annualLeak ?? 0).toLocaleString("en-US")],
          ["Currency", b.currency],
        ],
        link: { label: "Open Inbound Leads board", url: mondayBoardUrl(LEADS_BOARD_ID) },
      }),
    );
    return NextResponse.json({ ok: true, itemId: id });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not save lead", detail: String(e?.message || e) }, { status: 502 });
  }
}
