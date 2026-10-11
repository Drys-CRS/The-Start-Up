import { NextRequest, NextResponse } from "next/server";
import { listDealsForEmail } from "@/lib/db";
import { sendPortalLink } from "@/lib/email";
import { createLoginToken, normaliseEmail } from "@/lib/portal-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Ask for a sign-in link.
//
// The reply is the same whether or not the address has a project with us. The
// old portal told you outright when a reference and email did not match, which
// turns this into a way to ask "is this company a customer of yours". One
// response, one shape, whatever happened.
const SAME_ANSWER = {
  ok: true,
  message: "If that address has a project with us, the link is on its way. It is good for one hour.",
};

export async function POST(req: NextRequest) {
  // Tighter than the rest of the API: this one sends mail to an address the
  // caller chooses, so it is the obvious thing to point a script at.
  const limited = rateLimit(req, "portal-request", 3, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const email = normaliseEmail(body?.email || "");
  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "Enter the email address you used with us." }, { status: 400 });
  }

  const deals = await listDealsForEmail(email);
  if (deals.length === 0) return NextResponse.json(SAME_ANSWER);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const issued = await createLoginToken(email, ip);
  // A storage failure is ours, not theirs, and saying "on its way" when nothing
  // was sent leaves someone waiting on an email that will never arrive.
  if (!issued) {
    return NextResponse.json(
      { error: "We could not send that just now. Try again shortly, or email support@tsu.agency." },
      { status: 503 },
    );
  }

  await sendPortalLink({ to: email, token: issued.token, projects: deals.length });

  return NextResponse.json(SAME_ANSWER);
}
