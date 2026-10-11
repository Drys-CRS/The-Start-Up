import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getScopeStatus, addUpdateToItem } from "@/lib/monday";
import { sendTeamUpdateRequest } from "@/lib/email";
import { findScopeLock, listDealsForEmail, logActivity } from "@/lib/db";
import { PORTAL_COOKIE, readSession } from "@/lib/portal-auth";

export const runtime = "nodejs";

// Customer "nudge us" channel. Identity comes from the portal session, the
// same as /api/portal: the caller proved the address by clicking a link we
// emailed to it. The reference only selects which of their projects the
// message belongs to.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "request-update", 5, 60_000);
  if (limited) return limited;

  const email = readSession(req.cookies.get(PORTAL_COOKIE)?.value);
  if (!email) {
    return NextResponse.json({ error: "Your session has ended. Request a new sign-in link." }, { status: 401 });
  }

  const { ref, message } = await req.json().catch(() => ({}));
  const msg = (typeof message === "string" ? message : "").trim();
  if (!msg) {
    return NextResponse.json({ error: "Please include a short message." }, { status: 400 });
  }

  const NOT_FOUND = NextResponse.json({ error: "We could not find that project." }, { status: 404 });

  const deals = await listDealsForEmail(email);
  const chosen = (typeof ref === "string" && deals.find(d => d.ref_no === ref.trim())) || deals[0];
  if (!chosen) return NOT_FOUND;

  // Same reasoning as /api/portal: the message must still reach us when
  // Monday is unavailable. The board update is best effort below; the email
  // and the activity log are not.
  let record: Awaited<ReturnType<typeof getScopeStatus>> | null = null;
  try {
    record = await getScopeStatus(chosen.ref_no);
  } catch {
    record = null;
  }

  const refNo = record?.ref || chosen.ref_no;
  const deal = await findScopeLock({ refNo });

  const safe = msg.slice(0, 2000).replace(/</g, "&lt;");
  const itemId = record?.itemId || deal?.monday_item_id;
  if (itemId) {
    try {
      await addUpdateToItem(
        itemId,
        `<strong>Customer requested an update</strong><br>From: ${email}<br>Ref: ${refNo}<br><br>${safe}`,
      );
    } catch {
      // The board is where we work, but losing the note there must not lose
      // the message: the email and the activity log below still happen.
    }
  }
  await logActivity({
    kind: "update_request",
    scopeLockId: deal?.id || null,
    actor: "customer",
    body: `Customer requested an update: ${msg.slice(0, 160)}`,
    data: { email: email.trim() },
  });

  // Best-effort team notification; never blocks the response on email.
  await sendTeamUpdateRequest({ ref: refNo, email, message: msg });

  return NextResponse.json({ ok: true });
}
