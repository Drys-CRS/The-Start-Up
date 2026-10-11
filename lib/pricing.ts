// What the build costs, in one place.
//
// The price used to be written out by hand in seven files: the offer page, the
// Build Plan form, the sign page, the proposal PDF, the FAQ, the schema.org
// block and the Stripe links. A limited-time discount across all of those is
// exactly the change that leaves one of them saying something different, so
// they all read from here now.
//
// Nothing in this file touches the network or the environment, so client and
// server compute the same number and the page can never advertise a price the
// checkout will not charge. That property is enforced below: see earlyLive.

export type TierKey = "promo" | "premium";

const TIERS: Record<TierKey, { list: number; standard: number }> = {
  promo: { list: 3000, standard: 1500 },
  premium: { list: 5000, standard: 2500 },
};

/** The October early-signing offer: $500 off, on top of the half-price rate. */
export const EARLY_OFFER = {
  offUsd: 500,
  // "Sign before the 16th" means the offer is good through the end of the 15th.
  // The operating company is in Texas, so that is 23:59 Central, which in
  // October (CDT, UTC-5) is 05:00 UTC on the 16th. Stated as an instant rather
  // than a date string so there is no argument about whose midnight it was.
  endsAt: Date.UTC(2026, 9, 16, 5, 0, 0),
  deadlineLabel: "15 October 2026",
  shortLabel: "$500 off",
};

/** The half-price special the early offer sits on top of. */
export const PROMO_ENDS_LABEL = "31 Oct 2026";

// Stripe Payment Links for the discounted amounts. A Payment Link has its price
// baked in, so the $500 offer needs its own set and cannot reuse the standard
// ones.
//
// EMPTY UNTIL THE LINKS EXIST, AND THAT IS THE SWITCH. Every price shown on the
// site runs through earlyLive below, which returns false while a tier's links
// are missing, so the site keeps quoting the standard price until the thing
// that can charge the discounted one exists. Fill these in and the offer goes
// live everywhere at once: offer page, Build Plan, sign page, proposal PDF,
// FAQ and schema.
export const EARLY_PAYMENT_LINKS: Record<string, string> = {
  "promo|USD|deposit": "",
  "promo|USD|mvp": "",
  "promo|USD|balance": "",
  "premium|USD|deposit": "",
  "premium|USD|mvp": "",
  "premium|USD|balance": "",
};

/** True when every milestone link for the tier is present. */
export function hasEarlyLinks(tier: TierKey): boolean {
  return (["deposit", "mvp", "balance"] as const).every(p => !!EARLY_PAYMENT_LINKS[`${tier}|USD|${p}`]);
}

/** Whether the $500 offer applies right now, for this tier. */
export function earlyLive(tier: TierKey, now: number = Date.now()): boolean {
  return now < EARLY_OFFER.endsAt && hasEarlyLinks(tier);
}

export type Price = {
  tier: TierKey;
  /** What they pay today. */
  total: number;
  /** The half-price rate, before the October offer. */
  standard: number;
  /** Full rate, the struck-through number. */
  list: number;
  /** True when the October offer is applied to `total`. */
  early: boolean;
  /** 10% on signature, 80% on MVP plan approval, 10% on delivery. */
  deposit: number;
  mvp: number;
  balance: number;
};

export function priceFor(tier: TierKey, now: number = Date.now()): Price {
  const { list, standard } = TIERS[tier];
  const early = earlyLive(tier, now);
  const total = early ? standard - EARLY_OFFER.offUsd : standard;
  return {
    tier,
    total,
    standard,
    list,
    early,
    deposit: Math.round(total * 0.1),
    mvp: Math.round(total * 0.8),
    balance: Math.round(total * 0.1),
  };
}

export const usd = (n: number): string => "$" + n.toLocaleString("en-US");

/** The payment plan, in one sentence, for wherever the price is quoted. */
export const PAYMENT_PLAN_LINE =
  "Payment plan included: 10% to start, 80% once you approve the MVP plan, 10% on delivery.";

export function priceSentence(tier: TierKey = "promo", now: number = Date.now()): string {
  const p = priceFor(tier, now);
  const opener = p.early
    ? `One build fee of ${usd(p.total)}: ${usd(EARLY_OFFER.offUsd)} off the ${usd(p.standard)} half-price rate if you sign before 16 October 2026.`
    : `One build fee of ${usd(p.total)}, which is half the standard ${usd(p.list)} rate.`;
  return `${opener} ${PAYMENT_PLAN_LINE}`;
}
