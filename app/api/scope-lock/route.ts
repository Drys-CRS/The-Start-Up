import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createItem, SCOPE, SCOPE_BOARD_ID, today } from "@/lib/monday";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "scope-lock", 5, 60_000);
  if (limited) return limited;

  const b = await req.json().catch(() => null);
  if (!b || !/.+@.+\..+/.test(b.email || "")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const refNo = `SL-${Date.now().toString().slice(-8)}`;
  const columnValues: Record<string, unknown> = {
    [SCOPE.contact]: b.contact || "",
    [SCOPE.email]: { email: b.email, text: b.email },
    [SCOPE.tier]: { label: b.tier || "Premium" },
    [SCOPE.currency]: b.currency || "USD",
    [SCOPE.goal]: { text: b.goal || "" },
    [SCOPE.bottleneck]: { text: b.bottleneck || "" },
    [SCOPE.workflow]: { text: b.workflow || "" },
    [SCOPE.musthaves]: { text: b.musthaves || "" },
    [SCOPE.integrations]: b.integrations || "",
    [SCOPE.startDate]: b.startDate ? { date: b.startDate } : { date: today() },
    [SCOPE.stage]: { label: "New" },
    [SCOPE.submitted]: { date: today() },
    [SCOPE.ref]: refNo,
  };
  try {
    const id = await createItem(SCOPE_BOARD_ID, b.company || b.email, columnValues);
    return NextResponse.json({ ok: true, itemId: id, refNo });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not save scope lock", detail: String(e?.message || e) }, { status: 502 });
  }
}
