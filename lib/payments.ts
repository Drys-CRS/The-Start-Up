import { tierKey } from "./links";
import { EARLY_PAYMENT_LINKS, earlyLive, type TierKey } from "./pricing";

// Payment structure: 10% deposit → 80% MVP approval → 10% final balance.
// 50% off special (ends 31 Oct 2026). Regenerated via seed-stripe.mjs equivalent
// against Stripe account acct_1Tlz1sDdDUCT3Na5 (Cyber Retaliator Solutions LLC).
export const PAYMENT_LINKS: Record<string, string> = {
  // ── Promotional — 50% off ($1,500, was $3,000) ──────────────────────────
  "promo|USD|deposit": "https://buy.stripe.com/fZuaEX9BC8NxaCdf1t57W0c",
  "promo|USD|mvp":     "https://buy.stripe.com/14AcN5g00gfZ9y9g5x57W0d",
  "promo|USD|balance": "https://buy.stripe.com/14AfZh8xyaVFh0B3iL57W0e",
  // ── Advanced — integration and AI layer, $5,000, half up front ─────────
  // Empty until the links exist. The Advanced flow starts with a scoping call,
  // so a missing link is caught by a person rather than by a customer: the
  // deposit button only appears once the agreement is signed.
  "advanced|USD|deposit": "",
  "advanced|USD|balance": "",
  // ── Premium — 50% off ($2,500, was $5,000) ──────────────────────────────
  "premium|USD|deposit": "https://buy.stripe.com/fZucN56pqd3NfWxcTl57W0i",
  "premium|USD|mvp":     "https://buy.stripe.com/aFacN50123tdaCd4mP57W0j",
  "premium|USD|balance": "https://buy.stripe.com/3cI14ncNO9RBeSt4mP57W0k",
};

export type PaymentType = "deposit" | "mvp" | "balance";

// Stages at or beyond a paid deposit. A deposit link is never offered once one is set.
const PAID_STAGES = new Set(["Deposit Paid", "Planning", "Build Active", "In Build", "Delivered"]);

export function isDepositPaid(stageLabel: string): boolean {
  return PAID_STAGES.has((stageLabel || "").trim());
}

// Stripe Payment Link for a verified Scope Lock, prefilled with the Monday item id
// so the webhook can match the payment back. Null when its tier has no link.
export function paymentUrl(
  record: { itemId: string; email: string; tierLabel: string },
  paymentType: string = "deposit",
): string | null {
  const tier = tierKey(record.tierLabel);
  if (!tier) return null;

  // While the October offer is running, charge the discounted link. earlyLive
  // is false unless that tier's links actually exist, so this can never quote
  // one price on the page and charge another at the till.
  const key = `${tier}|USD|${paymentType}`;
  const base = earlyLive(tier as TierKey) ? EARLY_PAYMENT_LINKS[key] : PAYMENT_LINKS[key];
  if (!base) return null;
  const q = new URLSearchParams({ client_reference_id: record.itemId, prefilled_email: record.email });
  return `${base}?${q}`;
}
