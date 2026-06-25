import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { SCOPE_BOARD_ID, SCOPE, setSimpleColumn } from "@/lib/monday";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-05-27.dahlia",
});

export async function POST(req: NextRequest) {
  const sig     = req.headers.get("stripe-signature") || "";
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Bad signature: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session     = event.data.object as Stripe.Checkout.Session;
    const scopeLockId = session.client_reference_id;
    const paymentType = (session.metadata?.payment_type as string) || "deposit";

    // Map each payment stage to a Monday.com Scope Lock status label
    const STAGE_MAP: Record<string, string> = {
      deposit: "Deposit Paid",   // 10% — planning starts
      mvp:     "Build Active",   // 80% — MVP approved, full build underway
      balance: "Delivered",      // 10% — project complete
    };

    const stageLabel = STAGE_MAP[paymentType];
    if (scopeLockId && stageLabel) {
      try {
        await setSimpleColumn(SCOPE_BOARD_ID, scopeLockId, SCOPE.stage, stageLabel);
      } catch (e) {
        console.error("Monday update failed", e);
        return NextResponse.json({ error: "downstream failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
