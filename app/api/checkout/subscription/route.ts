import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });

const SUPPORT_USD_CENTS = 15000; // $150/month fixed

export async function POST(req: NextRequest) {
  const { toolsMonthlyUsd, email, ref, item } = await req.json().catch(() => ({}));

  if (toolsMonthlyUsd === undefined || toolsMonthlyUsd === null || isNaN(Number(toolsMonthlyUsd)) || Number(toolsMonthlyUsd) < 0) {
    return NextResponse.json({ error: "toolsMonthlyUsd must be a non-negative number" }, { status: 400 });
  }

  const toolsCents = Math.round(Number(toolsMonthlyUsd) * 100);

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "https://thestartup.app";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email || undefined,
    client_reference_id: item || ref || undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Ongoing Support", description: "Monthly support, maintenance, and guidance — $150/month" },
          unit_amount: SUPPORT_USD_CENTS,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
      ...(toolsCents > 0
        ? [
            {
              price_data: {
                currency: "usd",
                product_data: { name: "Tools & Subscriptions", description: "Estimated monthly cost of all tools and platforms required for your app" },
                unit_amount: toolsCents,
                recurring: { interval: "month" as const },
              },
              quantity: 1,
            },
          ]
        : []),
    ],
    success_url: `${origin}/sign/success?session_id={CHECKOUT_SESSION_ID}&type=monthly`,
    cancel_url:  `${origin}/sign?ref=${encodeURIComponent(ref || "")}&cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}
