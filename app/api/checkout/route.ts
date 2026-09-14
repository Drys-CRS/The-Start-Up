import { NextRequest, NextResponse } from "next/server";
import { resolveScopeLock } from "@/lib/monday";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Payment structure: 10% deposit → 80% MVP approval → 10% final balance.
// 50% off special (ends 30 Sep 2026). Regenerated via seed-stripe.mjs equivalent
// against Stripe account acct_1Tlz1sDdDUCT3Na5 (Cyber Retaliator Solutions LLC).
const LINKS: Record<string, string> = {
  // ── Promotional — 50% off ($1,500, was $3,000) ──────────────────────────
  "promo|USD|deposit": "https://buy.stripe.com/fZuaEX9BC8NxaCdf1t57W0c",
  "promo|USD|mvp":     "https://buy.stripe.com/14AcN5g00gfZ9y9g5x57W0d",
  "promo|USD|balance": "https://buy.stripe.com/14AfZh8xyaVFh0B3iL57W0e",
  // ── Premium — 50% off ($2,500, was $5,000) ──────────────────────────────
  "premium|USD|deposit": "https://buy.stripe.com/fZucN56pqd3NfWxcTl57W0i",
  "premium|USD|mvp":     "https://buy.stripe.com/aFacN50123tdaCd4mP57W0j",
  "premium|USD|balance": "https://buy.stripe.com/3cI14ncNO9RBeSt4mP57W0k",
};

// Map the tier label stored on the Scope Lock to its payment-link family.
function tierKey(label: string): "promo" | "premium" | null {
  if (/promo/i.test(label)) return "promo";
  if (/premium/i.test(label)) return "premium";
  return null;
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "checkout", 10, 60_000);
  if (limited) return limited;

  const { ref, item, email, paymentType = "deposit" } = await req.json().catch(() => ({}));

  // Identity and price both come from the Monday record, never the request, so a
  // customer can't pay against someone else's item or edit ?t= down to a cheaper tier.
  const record = await resolveScopeLock({ ref, item, email });
  if (!record) {
    return NextResponse.json(
      { error: "We couldn't find an agreement matching that reference and email." },
      { status: 404 },
    );
  }

  const tier = tierKey(record.tierLabel);
  const base = tier ? LINKS[`${tier}|USD|${paymentType}`] : undefined;
  if (!base) {
    return NextResponse.json(
      { error: "No payment option is set up for this agreement — please contact us." },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    client_reference_id: record.itemId,
    prefilled_email: record.email,
  });

  return NextResponse.json({ url: `${base}?${params.toString()}` });
}
