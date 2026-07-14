import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  const { tier, cur, item, email, paymentType = "deposit" } = await req.json().catch(() => ({}));

  // All tiers now follow the same key pattern
  const key = `${tier}|${cur}|${paymentType}`;

  const base = LINKS[key];
  if (!base) {
    return NextResponse.json({ error: `No payment link for "${key}"` }, { status: 400 });
  }

  const params = new URLSearchParams();
  if (item)  params.set("client_reference_id", item);
  if (email) params.set("prefilled_email",     email);

  return NextResponse.json({ url: `${base}?${params.toString()}` });
}
