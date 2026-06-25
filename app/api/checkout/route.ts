import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Payment structure: 10% deposit → 80% MVP approval → 10% final balance.
// Populated by running: STRIPE_SECRET_KEY=sk_live_... node seed-stripe.mjs
const LINKS: Record<string, string> = {
  // ── Promotional ($3,000 / R60,000) ──────────────────────────────────────
  "promo|USD|deposit": "https://buy.stripe.com/bJefZh29aaVF39L5qT57W00",
  "promo|USD|mvp":     "https://buy.stripe.com/4gM28r4hie7RdOp9H957W01",
  "promo|USD|balance": "https://buy.stripe.com/fZu14n4hi6Fph0BcTl57W02",
  "promo|ZAR|deposit": "https://buy.stripe.com/aFa4gz29a7Jt9y96uX57W03",
  "promo|ZAR|mvp":     "https://buy.stripe.com/6oUcN5dRSaVFdOp6uX57W04",
  "promo|ZAR|balance": "https://buy.stripe.com/fZu9ATdRSgfZ6lX2eH57W05",
  // ── Premium ($5,000 / R100,000) ─────────────────────────────────────────
  "premium|USD|deposit": "https://buy.stripe.com/5kQ28r156bZJ7q1f1t57W06",
  "premium|USD|mvp":     "https://buy.stripe.com/cNifZheVW1l5fWxbPh57W07",
  "premium|USD|balance": "https://buy.stripe.com/9B6bJ16pq0h125HaLd57W08",
  "premium|ZAR|deposit": "https://buy.stripe.com/7sY3cveVWgfZ5hTbPh57W09",
  "premium|ZAR|mvp":     "https://buy.stripe.com/4gM14n4hid3N4dP3iL57W0a",
  "premium|ZAR|balance": "https://buy.stripe.com/28E4gz6pq2p97q11aD57W0b",
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
