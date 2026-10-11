import Stripe from "stripe";
import { tierKey } from "./links";
import { EARLY_OFFER, priceFor, usd, type MilestoneKey, type TierKey } from "./pricing";
import { SITE_URL } from "./site";

// Checkout is built from lib/pricing at the moment someone clicks, not from a
// shelf of pre-made Stripe Payment Links.
//
// It used to be the shelf: six links, each with its amount baked in at the
// time it was created. That meant every price change was a manual job in the
// Stripe dashboard, the page and the till could disagree without anyone
// noticing, and a new tier or a limited-time discount could not go live until
// somebody made more links. It also left ZAR-era products lying around with
// amounts nobody had looked at in months.
//
// A Checkout Session costs one API call and takes its amount from the same
// function the offer page, the Build Plan, the agreement and the FAQ all read.
// The advertised price and the charged price are now the same number by
// construction rather than by diligence.

export type PaymentType = MilestoneKey;

// Stages at or beyond a paid deposit. A deposit link is never offered once one is set.
const PAID_STAGES = new Set(["Deposit Paid", "Planning", "Build Active", "In Build", "Delivered"]);

export function isDepositPaid(stageLabel: string): boolean {
  return PAID_STAGES.has((stageLabel || "").trim());
}

const MILESTONE_NAME: Record<MilestoneKey, string> = {
  deposit: "Deposit",
  mvp: "MVP plan approval",
  balance: "Final balance",
};

/**
 * A hosted Stripe Checkout page for one milestone of a verified deal.
 *
 * Returns null when the deal's tier is unrecognised or the milestone does not
 * exist for it: Advanced is paid in two parts, so asking it for "mvp" is a
 * caller error rather than something to improvise a price for.
 */
export async function createCheckoutUrl(
  record: { itemId: string; email: string; tierLabel: string; ref?: string },
  paymentType: PaymentType = "deposit",
): Promise<string | null> {
  const tier = tierKey(record.tierLabel) as TierKey | null;
  if (!tier) return null;

  const price = priceFor(tier);
  const milestone = price.schedule.find(m => m.key === paymentType);
  if (!milestone || milestone.amount <= 0) return null;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[payments] STRIPE_SECRET_KEY is not set; cannot start checkout");
    return null;
  }

  // Lazy-init: constructing Stripe at module scope breaks `next build` when the
  // key isn't present at build time.
  const stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });

  const pct = Math.round((milestone.amount / price.total) * 100);
  const description =
    `${price.name} package, ${usd(price.total)} total. ` +
    `This payment is ${pct}% (${milestone.note.toLowerCase()}).` +
    (price.early ? ` Includes the ${usd(EARLY_OFFER.offUsd)} early-signing discount.` : "");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: record.email,
    client_reference_id: record.itemId,
    // The webhook reads payment_type to decide which milestone was paid. The
    // old static links could not set it, so every payment was recorded as a
    // deposit.
    metadata: {
      payment_type: paymentType,
      tier,
      ref: record.ref || "",
      early_offer: price.early ? "yes" : "no",
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${MILESTONE_NAME[paymentType]} — ${price.name}`,
            description,
          },
          unit_amount: milestone.amount * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/sign/paid?session_id={CHECKOUT_SESSION_ID}&type=${paymentType}&ref=${encodeURIComponent(record.ref || "")}`,
    cancel_url: `${SITE_URL}/status`,
  });

  return session.url;
}
