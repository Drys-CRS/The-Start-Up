/**
 * seed-stripe.mjs
 * Creates products, prices, and payment links in the live Stripe account.
 * Payment structure: 10% deposit → 80% on MVP plan approval → 10% final balance.
 *
 * USD only: the app dropped ZAR pricing, so this no longer creates Rand prices
 * or links — they would have been dead entries in the live account.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node seed-stripe.mjs
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error("STRIPE_SECRET_KEY is not set"); process.exit(1); }
if (key.startsWith("sk_test_")) { console.error("Key is test mode — expected sk_live_..."); process.exit(1); }

const stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });

// ── Totals ─────────────────────────────────────────────────────────────────────
// 50% off special (ends 31 Oct 2026). Full-price reference: promo $3,000, premium $5,000.
const TOTALS = {
  promo:   { usd: 150000 },   // $1,500
  premium: { usd: 250000 },   // $2,500
};

function split(total) {
  const deposit = Math.round(total * 0.10);
  const mvp     = Math.round(total * 0.80);
  const balance = total - deposit - mvp;          // remainder = 10%
  return { deposit, mvp, balance };
}

async function run() {
  // ── Products ──────────────────────────────────────────────────────────────
  console.log("Creating products…");
  const [promo, premium] = await Promise.all([
    stripe.products.create({
      name: "The Start Up — Promotional Build",
      description: "30-day custom build + 60 days support. 50% off special — ends 31 Oct 2026 (was $3,000).",
      type: "service",
      metadata: { tier: "promo", build_days: "30", support_days: "60", promo_ends: "2026-10-31", discount_pct: "50", was_usd: "3000" },
    }),
    stripe.products.create({
      name: "The Start Up — Premium Build",
      description: "30-day custom build + support through day 120. 50% off special — ends 31 Oct 2026 (was $5,000).",
      type: "service",
      metadata: { tier: "premium", build_days: "30", total_days: "120", discount_pct: "50", was_usd: "5000" },
    }),
  ]);
  console.log(`  ✓ Promo   ${promo.id}`);
  console.log(`  ✓ Premium ${premium.id}`);

  // ── Prices ────────────────────────────────────────────────────────────────
  console.log("\nCreating prices…");

  function price(productId, currency, unitAmount, nickname, lookupKey, tier, paymentType) {
    return stripe.prices.create({
      product: productId, currency,
      unit_amount: unitAmount,
      nickname,
      lookup_key: lookupKey,
      metadata: { tier, payment_type: paymentType },
    });
  }

  const ps = split(TOTALS.promo.usd);
  const rs = split(TOTALS.premium.usd);

  const [
    promoUsdDep, promoUsdMvp, promoUsdBal,
    premUsdDep,  premUsdMvp,  premUsdBal,
  ] = await Promise.all([
    price(promo.id,   "usd", ps.deposit, "Promo — 10% deposit (USD)",       "promo_usd_deposit", "promo",   "deposit"),
    price(promo.id,   "usd", ps.mvp,     "Promo — 80% MVP payment (USD)",    "promo_usd_mvp",     "promo",   "mvp"),
    price(promo.id,   "usd", ps.balance, "Promo — 10% final balance (USD)",  "promo_usd_balance", "promo",   "balance"),

    price(premium.id, "usd", rs.deposit, "Premium — 10% deposit (USD)",      "premium_usd_deposit", "premium", "deposit"),
    price(premium.id, "usd", rs.mvp,     "Premium — 80% MVP payment (USD)",  "premium_usd_mvp",     "premium", "mvp"),
    price(premium.id, "usd", rs.balance, "Premium — 10% final balance (USD)","premium_usd_balance", "premium", "balance"),
  ]);

  console.log("  ✓ 6 prices created");

  // ── Payment Links ─────────────────────────────────────────────────────────
  console.log("\nCreating payment links…");

  function link(priceObj, currency, tier, paymentType) {
    return stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
      currency,
      customer_creation: "if_required",
      billing_address_collection: "auto",
      metadata: { tier, currency, payment_type: paymentType },
    });
  }

  const [
    plPromoUsdDep, plPromoUsdMvp, plPromoUsdBal,
    plPremUsdDep,  plPremUsdMvp,  plPremUsdBal,
  ] = await Promise.all([
    link(promoUsdDep, "usd", "promo",   "deposit"),
    link(promoUsdMvp, "usd", "promo",   "mvp"),
    link(promoUsdBal, "usd", "promo",   "balance"),

    link(premUsdDep,  "usd", "premium", "deposit"),
    link(premUsdMvp,  "usd", "premium", "mvp"),
    link(premUsdBal,  "usd", "premium", "balance"),
  ]);

  // ── Output ────────────────────────────────────────────────────────────────
  console.log("\n✅ All done! Paste into lib/payments.ts (PAYMENT_LINKS):\n");
  console.log(`export const PAYMENT_LINKS: Record<string, string> = {`);
  console.log(`  "promo|USD|deposit": "${plPromoUsdDep.url}",`);
  console.log(`  "promo|USD|mvp":     "${plPromoUsdMvp.url}",`);
  console.log(`  "promo|USD|balance": "${plPromoUsdBal.url}",`);
  console.log(`  "premium|USD|deposit": "${plPremUsdDep.url}",`);
  console.log(`  "premium|USD|mvp":     "${plPremUsdMvp.url}",`);
  console.log(`  "premium|USD|balance": "${plPremUsdBal.url}",`);
  console.log(`};`);

  console.log("\n── Deposit amounts for app/sign/page.tsx ──────────────────");
  console.log(`  promo  USD deposit: $${(ps.deposit/100).toLocaleString()} (10% of $${(TOTALS.promo.usd/100).toLocaleString()})`);
  console.log(`  premium USD deposit: $${(rs.deposit/100).toLocaleString()} (10% of $${(TOTALS.premium.usd/100).toLocaleString()})`);
}

run().catch(e => { console.error(e.message); process.exit(1); });
