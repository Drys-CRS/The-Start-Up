import { NextRequest, NextResponse } from "next/server";
import {
  LEADS, LEADS_BOARD_ID, SCOPE, SCOPE_BOARD_ID,
  getItemColumns, setSimpleColumn,
} from "@/lib/monday";
import { STOP } from "@/lib/follow-ups";
import { rateLimit } from "@/lib/rate-limit";
import { findScopeLock, logActivity, updateScopeLock } from "@/lib/db";

export const runtime = "nodejs";

const BOARDS = {
  leads: { boardId: LEADS_BOARD_ID, emailCol: LEADS.email, stateCol: LEADS.followups },
  scope: { boardId: SCOPE_BOARD_ID, emailCol: SCOPE.email, stateCol: SCOPE.followups },
};

// Stops automated follow-ups for one Monday item. POST-only (the /unsubscribe page
// asks for a click) so email link scanners can't unsubscribe people by prefetching.
// The item's stored email must match the one in the link.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "unsubscribe", 10, 60_000);
  if (limited) return limited;

  const { b, item, e } = await req.json().catch(() => ({}));
  const board = b === "leads" || b === "scope" ? BOARDS[b as keyof typeof BOARDS] : null;
  const itemId = typeof item === "string" && /^\d+$/.test(item) ? item : "";
  const email = typeof e === "string" ? e.trim().toLowerCase() : "";
  if (!board || !itemId || !email) {
    return NextResponse.json({ error: "This unsubscribe link is incomplete." }, { status: 400 });
  }

  const found = await getItemColumns(itemId, [board.emailCol]);
  if (
    !found ||
    found.boardId !== board.boardId ||
    (found.texts[board.emailCol] || "").trim().toLowerCase() !== email
  ) {
    return NextResponse.json({ error: "We couldn't find that subscription." }, { status: 404 });
  }

  try {
    await setSimpleColumn(board.boardId, itemId, board.stateCol, STOP);
  } catch (err) {
    console.error("unsubscribe write failed", itemId, err);
    return NextResponse.json({ error: "Something went wrong — please try again." }, { status: 502 });
  }
  if (b === "scope") {
    const deal = await findScopeLock({ mondayItemId: itemId });
    if (deal?.id) {
      await updateScopeLock(deal.id, { unsubscribedAt: new Date().toISOString() });
      await logActivity({
        kind: "unsubscribed",
        scopeLockId: deal.id,
        actor: "customer",
        body: "Unsubscribed from reminder emails",
      });
    }
  }
  return NextResponse.json({ ok: true });
}
