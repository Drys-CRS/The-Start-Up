import { SITE_URL } from "./site";

// Absolute, customer-facing URLs used in emails and redirects. Built in one place
// so the query parameters each page expects never drift between senders.

export type TierKey = "promo" | "premium" | "advanced";

// Map a Scope Lock's stored tier label to its pricing family. Advanced is
// checked first: its label is the only one a human might also write "premium"
// into, and the integration engagement is not a build tier.
export function tierKey(label: string): TierKey | null {
  if (/advanced/i.test(label)) return "advanced";
  if (/promo/i.test(label)) return "promo";
  if (/premium/i.test(label)) return "premium";
  return null;
}

export function signUrl(o: { ref: string; itemId: string; email: string; tierLabel: string }): string {
  const q = new URLSearchParams({
    ref: o.ref,
    item: o.itemId,
    t: tierKey(o.tierLabel) ?? "promo",
    c: "USD",
    e: o.email,
  });
  return `${SITE_URL}/sign?${q}`;
}

// Goes through /api/pay, which re-verifies the deal and redirects to Stripe.
export function payUrl(o: { itemId: string; email: string }): string {
  return `${SITE_URL}/api/pay?${new URLSearchParams({ item: o.itemId, e: o.email })}`;
}

export function statusUrl(ref?: string): string {
  return `${SITE_URL}/status${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
}

export function buildPlanUrl(): string {
  return `${SITE_URL}/calculator?step=buildplan`;
}

export type FollowUpBoard = "leads" | "scope";

export function unsubscribeUrl(o: { board: FollowUpBoard; itemId: string; email: string }): string {
  return `${SITE_URL}/unsubscribe?${new URLSearchParams({ b: o.board, item: o.itemId, e: o.email })}`;
}

export function mondayBoardUrl(boardId: string): string {
  return `https://view.monday.com/boards/${boardId}`;
}
