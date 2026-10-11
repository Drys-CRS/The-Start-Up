import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admins";
import { ADMIN_COOKIE, adminCookieOptions, consumeLoginToken, signSession } from "@/lib/portal-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const REASONS: Record<string, string> = {
  unknown: "That link is not valid. Request a new one.",
  expired: "That link has expired. They last an hour. Request a new one.",
  used: "That link has already been used. Request a new one.",
  unavailable: "Could not check that link just now. Try again in a moment.",
};

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "admin-session", 10, 10 * 60_000);
  if (limited) return limited;

  const { token } = await req.json().catch(() => ({}));

  // "admin" here is what stops a customer portal link opening this one.
  const result = await consumeLoginToken(token, "admin");
  if (!result.ok || !result.email) {
    const reason = result.reason || "unknown";
    return NextResponse.json({ error: REASONS[reason] }, { status: reason === "unavailable" ? 503 : 401 });
  }

  // Checked again on the way out: removing someone from the allowlist and
  // deploying locks them out even if they are holding an unspent link.
  if (!isAdminEmail(result.email)) {
    console.warn("[admin] spent link for an address no longer on the allowlist:", result.email);
    return NextResponse.json({ error: "That address can no longer open the admin portal." }, { status: 403 });
  }

  const session = signSession(result.email, "admin");
  if (!session) {
    console.error("[admin] no signing secret set; cannot issue a session");
    return NextResponse.json({ error: "Sign-in is unavailable right now." }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, session, adminCookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return res;
}
