import { NextRequest, NextResponse } from "next/server";
import { SCOPE_BOARD_ID, SCOPE, setSimpleColumn, addUpdateToItem } from "@/lib/monday";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { itemId } = await req.json().catch(() => ({}));
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  await setSimpleColumn(SCOPE_BOARD_ID, itemId, SCOPE.stage, "Deposit Paid");
  await addUpdateToItem(itemId, "✅ DEV BYPASS — marked as Deposit Paid without Stripe payment.");

  return NextResponse.json({ ok: true, itemId, stage: "Deposit Paid" });
}
