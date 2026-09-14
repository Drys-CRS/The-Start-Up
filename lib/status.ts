// Single source of truth for what each Scope Lock stage means, in plain language.
// Keyed by the exact Monday.com status labels used across the app
// (set in app/api/scope-lock, app/api/sign, and app/api/stripe-webhook).
// Consumed by both the customer status page (app/status) and the status emails
// (lib/email.ts) so the copy never drifts.

export type StageMeta = {
  title: string;        // short customer-facing stage name
  description: string;  // what this stage means
  next: string;         // what happens next
  step: number;         // 1-based position for a progress indicator
};

export const STAGE_ORDER = [
  "New",
  "Signed",
  "Deposit Paid",
  "Build Active",
  "Delivered",
] as const;

export const STAGE_META: Record<string, StageMeta> = {
  New: {
    title: "Build Plan received",
    description:
      "We have your Build Plan and it's in our pipeline. Our team is reviewing the scope, pricing, and a start date.",
    next: "Review and sign your agreement using the link in your confirmation email, then pay the 10% deposit to lock in your start date.",
    step: 1,
  },
  Signed: {
    title: "Agreement signed",
    description:
      "Your Scope Lock agreement is signed and on file. You're one step away from kicking off the build.",
    next: "Pay your 10% deposit to lock in your start date and begin the planning phase.",
    step: 2,
  },
  "Deposit Paid": {
    title: "Deposit paid — planning underway",
    description:
      "Your deposit is confirmed and planning has started. We'll be in touch within one business day to schedule your kick-off call.",
    next: "We finalise the plan and begin your build. Your 30-day build clock starts on the agreed start date.",
    step: 3,
  },
  "Build Active": {
    title: "Build in progress",
    description:
      "Your MVP is approved and the full build is underway. This is the main development phase of your project.",
    next: "We deliver your finished build for review, followed by the final 10% balance.",
    step: 4,
  },
  Delivered: {
    title: "Delivered",
    description:
      "Your build is complete and delivered. Thank you for building with The Startup.",
    next: "If you opted into ongoing support, your monthly plan keeps everything maintained and running.",
    step: 5,
  },
};

// Safe lookup that always returns something renderable, even for an unknown label.
export function stageMeta(label: string | null | undefined): StageMeta {
  const key = (label || "").trim();
  return (
    STAGE_META[key] || {
      title: key || "In progress",
      description: "Your order is being processed by our team.",
      next: "We'll be in touch with the next step shortly.",
      step: 0,
    }
  );
}
