import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-05-27.dahlia" });

// Amounts in smallest currency unit (cents / cents-equivalent).
// Promotional = flat fee. Premium = 50% deposit.
const PRICE_MAP: Record<string, Record<string, { amount: number; label: string }>> = {
  promo: {
    USD: { amount: 300000,  label: "Promotional Build Package — $3,000 flat fee" },
    ZAR: { amount: 6000000, label: "Promotional Build Package — R60,000 flat fee" },
  },
  premium: {
    USD: { amount: 250000,  label: "Premium Build Package — $2,500 deposit (50%)" },
    ZAR: { amount: 5000000, label: "Premium Build Package — R50,000 deposit (50%)" },
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const { ref, item, tier, cur } = await req.json().catch(() => ({}));

  const priceInfo = PRICE_MAP[tier as string]?.[cur as string] ?? PRICE_MAP.premium.USD;
  const currency  = cur === "ZAR" ? "zar" : "usd";

  const host    = req.headers.get("host") || "the-start-up-eight.vercel.app";
  const baseUrl = host.startsWith("localhost") ? `http://${host}` : `https://${host}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      quantity: 1,
      price_data: {
        currency,
        unit_amount: priceInfo.amount,
        product_data: {
          name: priceInfo.label,
          description: `Scope Lock Agreement — Ref ${ref || "—"}`,
        },
      },
    }],
    metadata: { ref: ref || "", item: item || "", tier: tier || "premium", cur: cur || "USD" },
    customer_email: undefined,
    success_url: `${baseUrl}/sign/paid?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/sign?ref=${encodeURIComponent(ref || "")}&item=${encodeURIComponent(item || "")}&t=${tier || "premium"}&c=${cur || "USD"}`,
  });

  return NextResponse.json({ url: session.url });
}
