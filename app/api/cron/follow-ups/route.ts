import { NextRequest, NextResponse } from "next/server";
import {
  LEADS, LEADS_BOARD_ID, SCOPE, SCOPE_BOARD_ID,
  addUpdateToItem, listBoardItems, setSimpleColumn, type BoardItem,
} from "@/lib/monday";
import { sendFollowUp } from "@/lib/email";
import { copyFor, dueStep, formatState, type Sequence } from "@/lib/follow-ups";
import { buildPlanUrl, payUrl, signUrl, unsubscribeUrl, type FollowUpBoard } from "@/lib/links";
import { findScopeLock, logActivity } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

// Daily Vercel Cron job (see vercel.json) that sends the follow-up sequences defined
// in lib/follow-ups.ts. Vercel authenticates cron calls with CRON_SECRET; without it
// set, the route refuses every request.

// Safety valve: anything beyond this waits for the next run.
const MAX_SENDS_PER_RUN = 40;

type Job = {
  board: FollowUpBoard;
  boardId: string;
  stateCol: string;
  item: BoardItem;
  email: string;
  sequence: Sequence;
  step: number;
  ctaUrl: string;
  ref: string | null;
  ctx: { company?: string; leak?: string };
};

// When a status column last changed, from its JSON value; falls back to item creation.
function stageChangedAt(item: BoardItem, colId: string): number {
  try {
    const v = JSON.parse(item.values[colId] || "{}");
    if (v.changed_at) return Date.parse(v.changed_at);
  } catch {
    // unparsable value — use creation time
  }
  return Date.parse(item.createdAt);
}

function money(amount: string, currency: string): string {
  const n = Math.round(Number(amount));
  if (!n || n <= 0) return "";
  return `${!currency || currency === "USD" ? "$" : `${currency} `}${n.toLocaleString("en-US")}`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const [scopeItems, leadItems] = await Promise.all([
    listBoardItems(SCOPE_BOARD_ID, [SCOPE.email, SCOPE.stage, SCOPE.ref, SCOPE.tier, SCOPE.followups]),
    listBoardItems(LEADS_BOARD_ID, [LEADS.email, LEADS.stage, LEADS.source, LEADS.leak, LEADS.currency, LEADS.followups]),
  ]);

  const jobs: Job[] = [];
  const emailsWithPlan = new Set<string>();

  for (const item of scopeItems) {
    const email = (item.texts[SCOPE.email] || "").trim().toLowerCase();
    if (!email) continue;
    emailsWithPlan.add(email);

    const stage = item.texts[SCOPE.stage] || "";
    let sequence: Sequence | null = null;
    let enteredAt = 0;
    let ctaUrl = "";
    if (stage === "New") {
      sequence = "plan_unsigned";
      enteredAt = Date.parse(item.createdAt);
      ctaUrl = signUrl({ ref: item.texts[SCOPE.ref] || "", itemId: item.id, email, tierLabel: item.texts[SCOPE.tier] || "" });
    } else if (stage === "Signed") {
      sequence = "signed_unpaid";
      enteredAt = stageChangedAt(item, SCOPE.stage);
      ctaUrl = payUrl({ itemId: item.id, email });
    }
    if (!sequence) continue;

    const step = dueStep(sequence, enteredAt, item.texts[SCOPE.followups] || "", now);
    if (step === null) continue;
    jobs.push({
      board: "scope", boardId: SCOPE_BOARD_ID, stateCol: SCOPE.followups,
      item, email, sequence, step, ctaUrl,
      ref: item.texts[SCOPE.ref] || null,
      ctx: { company: item.name },
    });
  }

  for (const item of leadItems) {
    const email = (item.texts[LEADS.email] || "").trim().toLowerCase();
    // Leads who went on to submit a Build Plan are handled by the Scope Lock sequences.
    if (!email || emailsWithPlan.has(email)) continue;
    if (item.texts[LEADS.source] !== "Lead Leakage Calculator") continue;
    const stage = item.texts[LEADS.stage] || "";
    if (stage !== "New Lead" && stage !== "Report Sent") continue;

    const step = dueStep("lead_no_plan", Date.parse(item.createdAt), item.texts[LEADS.followups] || "", now);
    if (step === null) continue;
    jobs.push({
      board: "leads", boardId: LEADS_BOARD_ID, stateCol: LEADS.followups,
      item, email, sequence: "lead_no_plan", step, ctaUrl: buildPlanUrl(),
      ref: null,
      ctx: { leak: money(item.texts[LEADS.leak] || "", item.texts[LEADS.currency] || "") },
    });
  }

  const sent: string[] = [];
  const failed: string[] = [];
  for (const job of jobs.slice(0, MAX_SENDS_PER_RUN)) {
    const copy = copyFor(job.sequence, job.step, job.ctx);
    const label = `${job.sequence} #${job.step + 1} → item ${job.item.id}`;
    const ok = await sendFollowUp({
      to: job.email,
      ...copy,
      ctaUrl: job.ctaUrl,
      unsubscribeUrl: unsubscribeUrl({ board: job.board, itemId: job.item.id, email: job.email }),
      template: `follow_up:${job.sequence}:${job.step + 1}`,
      ref: job.ref,
    });
    if (!ok) {
      failed.push(label);
      continue;
    }
    // Progress is recorded only after a confirmed send, so failed sends retry next run.
    try {
      await setSimpleColumn(job.boardId, job.item.id, job.stateCol, formatState(job.sequence, job.step + 1));
    } catch (e) {
      console.error("follow-up state write failed", job.item.id, e);
    }
    await addUpdateToItem(
      job.item.id,
      `<strong>Automated follow-up sent</strong><br>${job.sequence}, step ${job.step + 1}: ${copy.subject}`,
    );
    const deal = job.ref ? await findScopeLock({ refNo: job.ref }) : null;
    await logActivity({
      kind: "follow_up",
      scopeLockId: deal?.id || null,
      body: `Follow-up sent: ${copy.subject}`,
      data: { sequence: job.sequence, step: job.step + 1, to: job.email },
    });
    sent.push(label);
  }

  return NextResponse.json({
    ok: true,
    due: jobs.length,
    sent,
    failed,
    deferred: Math.max(0, jobs.length - MAX_SENDS_PER_RUN),
  });
}
