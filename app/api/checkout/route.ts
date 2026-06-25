import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Payment structure: 10% deposit → 80% MVP approval → 10% final balance.
// Populated by running: STRIPE_SECRET_KEY=sk_live_... node seed-stripe.mjs
const LINKS: Record<string, string> = {
  // ── Promotional ($3,000 / R60,000) ──────────────────────────────────────
  "promo|USD|deposit": "",   // $300  — 10%
  "promo|USD|mvp":     "",   // $2,400 — 80%
  "promo|USD|balance": "",   // $300  — 10%
  "promo|ZAR|deposit": "",   // R6,000 — 10%
  "promo|ZAR|mvp":     "",   // R48,000 — 80%
  "promo|ZAR|balance": "",   // R6,000 — 10%
  // ── Premium ($5,000 / R100,000) ─────────────────────────────────────────
  "premium|USD|deposit": "", // $500  — 10%
  "premium|USD|mvp":     "", // $4,000 — 80%
  "premium|USD|balance": "", // $500  — 10%
  "premium|ZAR|deposit": "", // R10,000 — 10%
  "premium|ZAR|mvp":     "", // R80,000 — 80%
  "premium|ZAR|balance": "", // R10,000 — 10%
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
