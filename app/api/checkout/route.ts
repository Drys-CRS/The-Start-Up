import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Payment Links from Stripe (test mode).
// Each link has client_reference_id + prefilled_email appended at runtime.
const LINKS: Record<string, string> = {
  "promo|USD":           "https://buy.stripe.com/test_aFacN51clfbPaVa7IJcV200",
  "promo|ZAR":           "https://buy.stripe.com/test_7sYcN5bQZ7Jn2oE6EFcV203",
  "premium|USD|deposit": "https://buy.stripe.com/test_fZu14ng7f0gV5AQ0ghcV202",
  "premium|USD|balance": "https://buy.stripe.com/test_8x26oH08h1kZaVa6EFcV206",
  "premium|ZAR|deposit": "https://buy.stripe.com/test_5kQdR9cV3aVzd3ibYZcV205",
  "premium|ZAR|balance": "https://buy.stripe.com/test_6oU4gzbQZ5Bf2oE7IJcV207",
};

export async function POST(req: NextRequest) {
  const { tier, cur, item, email, paymentType = "deposit" } = await req.json().catch(() => ({}));

  const key = tier === "promo"
    ? `promo|${cur}`
    : `premium|${cur}|${paymentType}`;

  const base = LINKS[key];
  if (!base) {
    return NextResponse.json({ error: `No payment link for "${key}"` }, { status: 400 });
  }

  const params = new URLSearchParams();
  if (item)  params.set("client_reference_id", item);
  if (email) params.set("prefilled_email",     email);

  return NextResponse.json({ url: `${base}?${params.toString()}` });
}
