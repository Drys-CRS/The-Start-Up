import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { SCOPE_BOARD_ID, SCOPE, setSimpleColumn, addUpdateToItem, getScopeById } from "@/lib/monday";
import { sendStatusEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Lazy-init: constructing Stripe at module scope breaks `next build` when
  // STRIPE_SECRET_KEY isn't present at build time (fresh clone / preview env).
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-05-27.dahlia",
  });

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

    // The optional monthly plan is a subscription checkout, not a build milestone.
    // Without this guard it falls through as a "deposit" and marks the Scope Lock
    // "Deposit Paid" even though no deposit was paid.
    if (session.mode === "subscription") {
      if (scopeLockId) {
        await addUpdateToItem(
          scopeLockId,
          `<strong>Monthly plan started</strong><br>Stripe session: ${session.id}`,
        );
      }
      return NextResponse.json({ received: true });
    }

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

      // Side-effects below are best-effort: a successful payment must never
      // become a webhook 500 because an update or email failed.
      const amount = session.amount_total != null
        ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}`
        : "—";
      const customerEmail = session.customer_details?.email || session.customer_email || null;

      try {
        // Look up the stored ref from the Monday item so the email can link
        // the customer straight to /status?ref=…
        const record = await getScopeById(scopeLockId).catch(() => null);
        const ref = record?.ref || "";

        await addUpdateToItem(
          scopeLockId,
          `<strong>Payment received</strong><br>Stage: ${stageLabel}<br>Amount: ${amount}<br>Stripe session: ${session.id}`,
        );
        await sendStatusEmail({ to: customerEmail, stageLabel, ref });
      } catch (e) {
        console.error("post-payment side-effect failed", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
