import { NextRequest, NextResponse } from "next/server";
import { adminEmails, isAdminEmail } from "@/lib/admins";
import { createLoginToken, normaliseEmail } from "@/lib/portal-auth";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

// Break glass: mint an admin sign-in link and hand it back instead of emailing
// it. The partner portal has the same escape hatch (lib/msp/magicLinkCapture)
// for partners whose mail we cannot reach; here it is for the case where
// Resend is down, the mailbox is broken, or a new administrator needs to get
// in before DNS is sorted out.
//
// Behind the middleware's ADMIN_PASSWORD gate, which is why it lives under
// /api/dev. That password can therefore still mint an admin session, so it is
// a credential worth protecting even though the UI no longer accepts it.
//
//   curl -u x:$ADMIN_PASSWORD "https://tsu.agency/api/dev/admin-link?email=you@..."
export async function GET(req: NextRequest) {
  const email = normaliseEmail(req.nextUrl.searchParams.get("email") || "");

  if (!email) {
    return NextResponse.json({
      error: "Pass ?email=",
      allowed: adminEmails(),
    }, { status: 400 });
  }
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Not on the admin allowlist.", allowed: adminEmails() }, { status: 403 });
  }

  const issued = await createLoginToken(email, "break-glass", "admin");
  if (!issued) return NextResponse.json({ error: "Could not issue a token." }, { status: 503 });

  return NextResponse.json({
    ok: true,
    email,
    url: `${SITE_URL}/admin/enter?t=${encodeURIComponent(issued.token)}`,
    expiresAt: issued.expiresAt.toISOString(),
    note: "One use, one hour. Anyone holding this URL can open the admin portal.",
  });
}
