import { NextRequest, NextResponse } from "next/server";
import { LEADS, LEADS_BOARD_ID, SCOPE, SCOPE_BOARD_ID, listBoardItems } from "@/lib/monday";
import { backfillLead, backfillScopeLock, dbConfigured, type BackfillResult } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

// One-off import of the Monday.com history into Postgres, so the admin portal opens
// with real records instead of empty tables. Lives under /api/dev, which middleware.ts
// protects with the admin password. Safe to re-run: anything already mirrored is
// skipped, and original Monday timestamps are preserved.

const num = (v: string | undefined): number | null => {
  const n = Number(v);
  return v && Number.isFinite(n) ? n : null;
};

export async function POST(_req: NextRequest) {
  if (!dbConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const [scopeItems, leadItems] = await Promise.all([
    listBoardItems(SCOPE_BOARD_ID, [
      SCOPE.email, SCOPE.contact, SCOPE.tier, SCOPE.currency, SCOPE.goal, SCOPE.bottleneck,
      SCOPE.workflow, SCOPE.musthaves, SCOPE.integrations, SCOPE.startDate, SCOPE.stage,
      SCOPE.ref, SCOPE.followups,
    ]),
    listBoardItems(LEADS_BOARD_ID, [
      LEADS.email, LEADS.industry, LEADS.leads, LEADS.deal, LEADS.closeRate, LEADS.response,
      LEADS.leak, LEADS.currency, LEADS.source, LEADS.stage, LEADS.followups,
    ]),
  ]);

  const tally = {
    leads: { inserted: 0, skipped: 0, failed: 0 },
    deals: { inserted: 0, skipped: 0, failed: 0 },
  };
  const count = (group: "leads" | "deals", r: BackfillResult) => { tally[group][r] += 1; };

  for (const item of leadItems) {
    const source = item.texts[LEADS.source] || "";
    count("leads", await backfillLead({
      kind: /tailor/i.test(source) ? "tailor" : "calculator",
      email: item.texts[LEADS.email] || "",
      company: item.name,
      industry: item.texts[LEADS.industry] || null,
      currency: item.texts[LEADS.currency] || "USD",
      monthlyLeads: num(item.texts[LEADS.leads]),
      avgDealValue: num(item.texts[LEADS.deal]),
      closeRate: num(item.texts[LEADS.closeRate]),
      responseTime: item.texts[LEADS.response] || null,
      annualLeak: num(item.texts[LEADS.leak]),
      source: source || null,
      mondayItemId: item.id,
      createdAt: item.createdAt || null,
      raw: { backfilledFrom: "monday", stage: item.texts[LEADS.stage] || "", followups: item.texts[LEADS.followups] || "" },
    }));
  }

  for (const item of scopeItems) {
    // Deals created before the Ref No column existed have no ref, and ref_no is the
    // unique key here, so fall back to something stable: the Monday item id.
    const refNo = (item.texts[SCOPE.ref] || "").trim() || `LEGACY-${item.id}`;
    count("deals", await backfillScopeLock({
      refNo,
      email: item.texts[SCOPE.email] || "",
      company: item.name,
      contact: item.texts[SCOPE.contact] || null,
      tier: item.texts[SCOPE.tier] || null,
      currency: item.texts[SCOPE.currency] || "USD",
      goal: item.texts[SCOPE.goal] || null,
      bottleneck: item.texts[SCOPE.bottleneck] || null,
      workflow: item.texts[SCOPE.workflow] || null,
      musthaves: item.texts[SCOPE.musthaves] || null,
      integrations: item.texts[SCOPE.integrations] || null,
      startDate: item.texts[SCOPE.startDate] || null,
      stage: item.texts[SCOPE.stage] || "New",
      mondayItemId: item.id,
      createdAt: item.createdAt || null,
      raw: { backfilledFrom: "monday", followups: item.texts[SCOPE.followups] || "" },
    }));
  }

  return NextResponse.json({
    ok: true,
    scanned: { leads: leadItems.length, deals: scopeItems.length },
    ...tally,
  });
}
