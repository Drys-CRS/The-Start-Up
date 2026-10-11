import { NextRequest, NextResponse } from "next/server";
import { consumeLoginToken, PORTAL_COOKIE, sessionCookieOptions, signSession } from "@/lib/portal-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Exchange a one-time token for a session.
//
// POST only, deliberately. The link in the email is a GET to a page with a
// button on it; this is what the button calls. Mail scanners that pre-fetch
// links hit the page, not this, so the token is still there when the person
// arrives. That interstitial is the single most important detail in this
// flow and it is the reason the partner portal has /confirm-login.
const REASONS: Record<string, string> = {
  unknown: "That link is not valid. Request a new one below.",
  expired: "That link has expired. They last an hour. Request a new one below.",
  used: "That link has already been used. Request a new one below.",
  unavailable: "We could not check that link just now. Try again in a moment.",
};

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "portal-session", 10, 10 * 60_000);
  if (limited) return limited;

  const { token } = await req.json().catch(() => ({}));
  const result = await consumeLoginToken(token);
  if (!result.ok || !result.email) {
    const reason = result.reason || "unknown";
    return NextResponse.json({ error: REASONS[reason] }, { status: reason === "unavailable" ? 503 : 401 });
  }

  const session = signSession(result.email);
  if (!session) {
    console.error("[portal] no signing secret set; cannot issue a session");
    return NextResponse.json({ error: "Sign-in is unavailable right now. Email support@tsu.agency." }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE, session, sessionCookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
