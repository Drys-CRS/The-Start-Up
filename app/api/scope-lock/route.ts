import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { waitUntil } from "@vercel/functions";
import { sendBuildPlanConfirmation, sendTeamAlert } from "@/lib/email";
import { mondayBoardUrl, signUrl } from "@/lib/links";
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

    // Email the signing link right away, so the deal survives a closed tab.
    const emailed = await sendBuildPlanConfirmation({
      to: b.email,
      company: b.company || "",
      ref: refNo,
      signUrl: signUrl({ ref: refNo, itemId: id, email: b.email, tierLabel: b.tier || "Premium" }),
    });
    waitUntil(
      sendTeamAlert({
        subject: `New Build Plan: ${b.company || b.email}`,
        heading: "A new Build Plan was submitted",
        rows: [
          ["Company", b.company],
          ["Contact", b.contact],
          ["Email", b.email],
          ["Tier", b.tier],
          ["Primary goal", b.goal],
          ["Bottleneck", b.bottleneck],
          ["Target start", b.startDate],
          ["Reference", refNo],
          ["Confirmation emailed", emailed ? "Yes" : "No — check Resend configuration"],
        ],
        link: { label: "Open Scope Locks board", url: mondayBoardUrl(SCOPE_BOARD_ID) },
      }),
    );
    return NextResponse.json({ ok: true, itemId: id, refNo, emailed });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not save scope lock", detail: String(e?.message || e) }, { status: 502 });
  }
}
