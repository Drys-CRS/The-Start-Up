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

export type TierKey = "promo" | "premium" | "advanced";

export type MilestoneKey = "deposit" | "mvp" | "balance";

type Milestone = { key: MilestoneKey; pct: number; label: string; note: string };

// Two shapes. The build tiers are paid against delivery milestones; Advanced is
// half up front, because the work starts with us inside someone else's systems
// and the scoping is the expensive part.
const BUILD_SCHEDULE: Milestone[] = [
  { key: "deposit", pct: 0.1, label: "10% now", note: "Deposit, secures your start date" },
  { key: "mvp", pct: 0.8, label: "80% on approval", note: "After the MVP plan is reviewed and approved" },
  { key: "balance", pct: 0.1, label: "10% on delivery", note: "Final balance at end of the 30-day build" },
];

const HALF_SCHEDULE: Milestone[] = [
  { key: "deposit", pct: 0.5, label: "50% now", note: "Deposit, books the scoping call and the work" },
  { key: "balance", pct: 0.5, label: "50% on delivery", note: "Final balance on handover" },
];

type TierConfig = {
  /** The label the rest of the app stores on the deal. */
  value: string;
  name: string;
  list: number;
  standard: number;
  schedule: Milestone[];
  /** Advanced starts with a conversation: we cannot scope it without access. */
  requiresCall: boolean;
  /** Whether the October $500 offer applies. */
  earlyEligible: boolean;
  supportDays: number;
};

export const TIER_CONFIG: Record<TierKey, TierConfig> = {
  promo: {
    value: "PROMOTIONAL (Base + Free 2 Months)",
    name: "Promotional",
    list: 3000,
    standard: 1500,
    schedule: BUILD_SCHEDULE,
    requiresCall: false,
    earlyEligible: true,
    supportDays: 60,
  },
  premium: {
    value: "Premium",
    name: "Premium",
    list: 5000,
    standard: 2500,
    schedule: BUILD_SCHEDULE,
    requiresCall: false,
    earlyEligible: true,
    supportDays: 90,
  },
  // Not a bigger build. A different job: keep the systems you have and work out
  // how they talk to each other, and where AI belongs in the workflow. Priced
  // at full rate because it is new, and excluded from the October discount for
  // the same reason.
  advanced: {
    value: "Advanced (Integration + AI Layer)",
    name: "Advanced",
    list: 5000,
    standard: 5000,
    schedule: HALF_SCHEDULE,
    requiresCall: true,
    earlyEligible: false,
    supportDays: 60,
  },
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
  if (!TIER_CONFIG[tier]?.earlyEligible) return false;
  return TIER_CONFIG[tier].schedule.every(m => !!EARLY_PAYMENT_LINKS[`${tier}|USD|${m.key}`]);
}

/** Whether the $500 offer applies right now, for this tier. */
export function earlyLive(tier: TierKey, now: number = Date.now()): boolean {
  return now < EARLY_OFFER.endsAt && hasEarlyLinks(tier);
}

export type Price = {
  tier: TierKey;
  name: string;
  /** What they pay in total. */
  total: number;
  /** The rate before the October offer. */
  standard: number;
  /** Full rate, the struck-through number. Equal to standard when nothing is off. */
  list: number;
  /** True when the October offer is applied to `total`. */
  early: boolean;
  /** True when this tier is discounted off list at all. */
  discounted: boolean;
  requiresCall: boolean;
  supportDays: number;
  /** The payment plan, already costed. */
  schedule: { key: MilestoneKey; label: string; note: string; amount: number }[];
  /** Convenience accessors. Zero for a milestone this tier does not have. */
  deposit: number;
  mvp: number;
  balance: number;
};

export function priceFor(tier: TierKey, now: number = Date.now()): Price {
  const cfg = TIER_CONFIG[tier];
  const early = earlyLive(tier, now);
  const total = early ? cfg.standard - EARLY_OFFER.offUsd : cfg.standard;

  // Rounded per milestone, then the largest one absorbs any rounding error, so
  // the plan always adds up to the total exactly.
  const schedule = cfg.schedule.map(m => ({
    key: m.key,
    label: m.label,
    note: m.note,
    amount: Math.round(total * m.pct),
  }));
  const drift = total - schedule.reduce((sum, m) => sum + m.amount, 0);
  if (drift !== 0) {
    const biggest = schedule.reduce((a, b) => (b.amount > a.amount ? b : a));
    biggest.amount += drift;
  }

  const amountOf = (k: MilestoneKey) => schedule.find(m => m.key === k)?.amount ?? 0;

  return {
    tier,
    name: cfg.name,
    total,
    standard: cfg.standard,
    list: cfg.list,
    early,
    discounted: total < cfg.list,
    requiresCall: cfg.requiresCall,
    supportDays: cfg.supportDays,
    schedule,
    deposit: amountOf("deposit"),
    mvp: amountOf("mvp"),
    balance: amountOf("balance"),
  };
}

export const usd = (n: number): string => "$" + n.toLocaleString("en-US");

/** The payment plan, in one sentence, for wherever the price is quoted. */
export const PAYMENT_PLAN_LINE =
  "Payment plan included: 10% to start, 80% once you approve the MVP plan, 10% on delivery.";

/** Said wherever the Advanced option is offered. The timeline caveat is not
 *  small print: if a vendor will not let us integrate, the work changes shape. */
export const ADVANCED = {
  summary:
    "Keep the systems you already run. We work out how they connect to each other and where AI belongs in your workflow, then build that layer.",
  requires: [
    "A scoping call with us before anything starts.",
    "Access to the systems you want connected, or someone on your side who can grant it.",
  ],
  caveat:
    "If one of your vendors has no supported way for us to integrate, no API, no export, no webhook, we have to replicate that piece before we can connect it. That takes longer than 30 days and we will tell you at the scoping call if it applies. It does not cost more: replication is covered by the engagement fee you have already agreed.",
};

export function priceSentence(tier: TierKey = "promo", now: number = Date.now()): string {
  const p = priceFor(tier, now);
  if (tier === "advanced") {
    return `${usd(p.total)} for the engagement, ${usd(p.deposit)} to start and ${usd(p.balance)} on handover. ${ADVANCED.summary}`;
  }
  const opener = p.early
    ? `One build fee of ${usd(p.total)}: ${usd(EARLY_OFFER.offUsd)} off the ${usd(p.standard)} half-price rate if you sign before 16 October 2026.`
    : `One build fee of ${usd(p.total)}, which is half the standard ${usd(p.list)} rate.`;
  return `${opener} ${PAYMENT_PLAN_LINE}`;
}
