import { NextRequest } from "next/server";
import Stripe from "stripe";
import { addUpdateToItem, changeItemStage } from "@/lib/monday";

export const runtime = "nodejs";

// Disable body parsing — Stripe signature verification needs the raw body.
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-05-27.dahlia" });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhook not configured", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session  = event.data.object as Stripe.Checkout.Session;
    const { ref, item } = session.metadata ?? {};
    const amount   = session.amount_total != null
      ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}`
      : "—";

    if (item) {
      await Promise.allSettled([
        changeItemStage(item, "Paid"),
        addUpdateToItem(
          item,
          `<strong>Payment received</strong><br>Amount: ${amount}<br>Reference: ${ref}<br>Stripe session: ${session.id}`,
        ),
      ]);
    }
  }

  return new Response("ok");
}
