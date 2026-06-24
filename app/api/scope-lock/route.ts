import { NextRequest, NextResponse } from "next/server";
import { createItem, SCOPE, SCOPE_BOARD_ID, today } from "@/lib/monday";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b || !/.+@.+\..+/.test(b.email || "")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const columnValues: Record<string, unknown> = {
    [SCOPE.contact]: b.contact || "",
    [SCOPE.email]: { email: b.email, text: b.email },
    [SCOPE.tier]: { label: b.tier || "Core" },
    [SCOPE.currency]: b.currency || "USD",
    [SCOPE.goal]: b.goal || "",
    [SCOPE.bottleneck]: b.bottleneck || "",
    [SCOPE.workflow]: b.workflow || "",
    [SCOPE.musthaves]: b.musthaves || "",
    [SCOPE.integrations]: b.integrations || "",
    [SCOPE.startDate]: b.startDate ? { date: b.startDate } : { date: today() },
    [SCOPE.stage]: { label: "New" },
    [SCOPE.submitted]: { date: today() },
  };
  try {
    const id = await createItem(SCOPE_BOARD_ID, b.company || b.email, columnValues);
    return NextResponse.json({ ok: true, itemId: id });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not save scope lock", detail: String(e?.message || e) }, { status: 502 });
  }
}
