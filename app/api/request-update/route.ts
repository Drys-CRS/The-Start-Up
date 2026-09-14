import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getScopeStatus, addUpdateToItem } from "@/lib/monday";
import { sendTeamUpdateRequest } from "@/lib/email";

export const runtime = "nodejs";

// Customer "nudge us" channel. Re-verifies ref + email (same rule as /api/status)
// then posts the message as an update on the Monday item where the team works,
// and best-effort notifies the team by email.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "request-update", 5, 60_000);
  if (limited) return limited;

  const { ref, email, message } = await req.json().catch(() => ({}));

  if (!ref || !email || typeof ref !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "A reference number and email are required." }, { status: 400 });
  }
  const msg = (typeof message === "string" ? message : "").trim();
  if (!msg) {
    return NextResponse.json({ error: "Please include a short message." }, { status: 400 });
  }

  const NOT_FOUND = NextResponse.json(
    { error: "We couldn't find an order matching that reference and email." },
    { status: 404 },
  );

  let record;
  try {
    record = await getScopeStatus(ref.trim());
  } catch {
    return NOT_FOUND;
  }
  if (!record || record.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return NOT_FOUND;
  }

  const safe = msg.slice(0, 2000).replace(/</g, "&lt;");
  await addUpdateToItem(
    record.itemId,
    `<strong>Customer requested an update</strong><br>From: ${email}<br>Ref: ${record.ref || ref}<br><br>${safe}`,
  );
  // Best-effort team notification; never blocks the response on email.
  await sendTeamUpdateRequest({ ref: record.ref || ref.trim(), email: email.trim(), message: msg });

  return NextResponse.json({ ok: true });
}
