import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admins";
import { sendAdminLink } from "@/lib/email";
import { createLoginToken, normaliseEmail } from "@/lib/portal-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Ask for an admin sign-in link.
//
// Only an address on the allowlist is ever sent one, and the reply is the same
// either way so this cannot be used to find out who the administrators are.
const SAME_ANSWER = {
  ok: true,
  message: "If that address can open the admin portal, the link is on its way. It is good for one hour.",
};

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "admin-request", 3, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const email = normaliseEmail(body?.email || "");
  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "Enter your work email address." }, { status: 400 });
  }

  if (!isAdminEmail(email)) {
    // Logged, because somebody trying to get into the admin portal is worth
    // knowing about, and the address is not a secret from us.
    console.warn("[admin] sign-in link refused for", email);
    return NextResponse.json(SAME_ANSWER);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const issued = await createLoginToken(email, ip, "admin");
  if (!issued) {
    return NextResponse.json({ error: "Could not issue a link just now. Try again shortly." }, { status: 503 });
  }

  await sendAdminLink({ to: email, token: issued.token });
  return NextResponse.json(SAME_ANSWER);
}
