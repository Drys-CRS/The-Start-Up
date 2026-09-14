import { NextRequest, NextResponse } from "next/server";
import { resolveScopeLock } from "@/lib/monday";
import { isDepositPaid, paymentUrl } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { statusUrl } from "@/lib/links";

export const runtime = "nodejs";

// Deposit link used in follow-up emails. Verifies the Scope Lock from the link's
// item id + email, then redirects straight to its Stripe Payment Link, or to the
// status page when the link no longer applies (unknown deal, deposit already paid).
// Safe for email link scanners to prefetch: it only ever redirects.
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, "pay", 20, 60_000);
  if (limited) return limited;

  const p = req.nextUrl.searchParams;
  const record = await resolveScopeLock({ item: p.get("item"), email: p.get("e") });
  if (!record || isDepositPaid(record.stageLabel)) {
    return NextResponse.redirect(statusUrl(record?.ref), 303);
  }

  return NextResponse.redirect(paymentUrl(record) || statusUrl(record.ref), 303);
}
