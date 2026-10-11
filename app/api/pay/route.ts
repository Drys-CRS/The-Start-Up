import { NextRequest, NextResponse } from "next/server";
import { resolveScopeLock } from "@/lib/monday";
import { createCheckoutUrl, isDepositPaid } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { statusUrl } from "@/lib/links";

export const runtime = "nodejs";

// Deposit link used in follow-up emails. Verifies the Scope Lock from the link's
// item id + email, then redirects to a fresh Stripe Checkout page priced from
// lib/pricing, or to the status page when the link no longer applies (unknown
// deal, deposit already paid).
//
// A prefetching mail scanner will create an abandoned Checkout Session, which
// costs nothing and expires on its own. It must not charge anybody, and it
// does not: a session is an offer to pay, not a payment.
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, "pay", 20, 60_000);
  if (limited) return limited;

  const p = req.nextUrl.searchParams;
  const record = await resolveScopeLock({ item: p.get("item"), email: p.get("e") });
  if (!record || isDepositPaid(record.stageLabel)) {
    return NextResponse.redirect(statusUrl(record?.ref), 303);
  }

  let url: string | null = null;
  try {
    url = await createCheckoutUrl(record);
  } catch (e) {
    console.error("[pay] Stripe rejected the session:", e);
  }
  return NextResponse.redirect(url || statusUrl(record.ref), 303);
}
