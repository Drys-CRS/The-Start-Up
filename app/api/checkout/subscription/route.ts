import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { resolveScopeLock } from "@/lib/monday";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

const SUPPORT_USD_CENTS = 15000; // $150/month fixed

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "checkout-subscription", 10, 60_000);
  if (limited) return limited;

  const { toolsMonthlyUsd, email, ref, item } = await req.json().catch(() => ({}));

  if (toolsMonthlyUsd === undefined || toolsMonthlyUsd === null || isNaN(Number(toolsMonthlyUsd)) || Number(toolsMonthlyUsd) < 0) {
    return NextResponse.json({ error: "toolsMonthlyUsd must be a non-negative number" }, { status: 400 });
  }

  // Attach the plan to a verified Scope Lock — never to ids taken from the request.
  const record = await resolveScopeLock({ ref, item, email });
  if (!record) {
    return NextResponse.json(
      { error: "We couldn't find an agreement matching that reference and email." },
      { status: 404 },
    );
  }

  const toolsCents = Math.round(Number(toolsMonthlyUsd) * 100);

  // Redirects use the canonical origin, not the request's Origin header, and the
  // cancel link carries everything the sign page needs to resume payment.
  const signBack = new URLSearchParams({
    ref: record.ref || String(ref || ""),
    item: record.itemId,
    e: record.email,
    t: /premium/i.test(record.tierLabel) ? "premium" : "promo",
    cancelled: "1",
  });

  // Lazy-init: constructing Stripe at module scope breaks `next build` when
  // STRIPE_SECRET_KEY isn't present at build time (fresh clone / preview env).
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: record.email,
    client_reference_id: record.itemId,
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
    success_url: `${SITE_URL}/sign/paid?session_id={CHECKOUT_SESSION_ID}&type=monthly&ref=${encodeURIComponent(record.ref)}`,
    cancel_url:  `${SITE_URL}/sign?${signBack.toString()}`,
  });

  return NextResponse.json({ url: session.url });
}
