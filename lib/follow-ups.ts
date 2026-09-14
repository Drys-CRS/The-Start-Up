// Automated follow-up sequences for the three places warm prospects stall:
//   lead_no_plan  — ran the calculator and left an email, never started a Build Plan
//   plan_unsigned — submitted a Build Plan, never signed the agreement
//   signed_unpaid — signed the agreement, never paid the deposit
//
// Progress is stored per Monday item in its "Follow-ups" text column as
// "<sequence>:<steps sent>", or "stop" once the recipient unsubscribes. Entering a
// new stage starts that stage's sequence from zero. The cron route sends at most one
// email per item per run.

export type Sequence = "lead_no_plan" | "plan_unsigned" | "signed_unpaid";

// Items that entered their stage before follow-ups launched are never emailed, so
// the first run can't blast the historical backlog.
export const FOLLOW_UPS_START = Date.parse("2026-09-14T00:00:00Z");

export const STOP = "stop";

const HOUR = 3_600_000;

type Ctx = { company?: string; leak?: string };

export type FollowUpCopy = {
  subject: string;
  heading: string;
  paragraphs: string[];
  cta: string;
};

type Step = { afterHours: number; copy: (c: Ctx) => FollowUpCopy };

// A company name read back from Monday falls back to the email when none was given.
const forCompany = (c: Ctx) => (c.company && !c.company.includes("@") ? ` for ${c.company}` : "");

const SEQUENCES: Record<Sequence, Step[]> = {
  lead_no_plan: [
    {
      afterHours: 24,
      copy: c => ({
        subject: c.leak ? `Your estimated revenue leak: ${c.leak} a year` : "The leak you found doesn't close itself",
        heading: "That leak doesn't close itself",
        paragraphs: [
          c.leak
            ? `You ran our Lead Leakage Calculator and found an estimated ${c.leak} a year slipping through your sales cycle.`
            : "You ran our Lead Leakage Calculator and found where revenue is slipping through your sales cycle.",
          "The quickest way to fix it is a Build Plan: a 10-minute questionnaire that turns your numbers into a fixed scope, ship date, and price. No call required.",
        ],
        cta: "Start your Build Plan",
      }),
    },
    {
      afterHours: 96,
      copy: () => ({
        subject: "Most teams already have a CRM. The leak is around it.",
        heading: "The fix is usually the process, not the software",
        paragraphs: [
          "Leads stall between stages, follow-ups get skipped, and nobody notices until the month closes. We rebuild that process and the automation around it in 30 days, for a fixed price, and you own everything we build.",
          "Your Build Plan takes about 10 minutes.",
        ],
        cta: "Start your Build Plan",
      }),
    },
  ],
  plan_unsigned: [
    {
      afterHours: 24,
      copy: c => ({
        subject: "Your Build Plan is ready to sign",
        heading: "Pick up where you left off",
        paragraphs: [
          `Your Build Plan${forCompany(c)} is saved. Signing takes about a minute, and the 10% deposit confirms your start date.`,
        ],
        cta: "Review and sign",
      }),
    },
    {
      afterHours: 72,
      copy: () => ({
        subject: "Your start date isn't confirmed yet",
        heading: "One signature away",
        paragraphs: [
          "Your start date is only confirmed once the agreement is signed and the 10% deposit is paid. Everything else is ready to go.",
          "Questions about the scope or price? Reply to this email.",
        ],
        cta: "Review and sign",
      }),
    },
    {
      afterHours: 168,
      copy: () => ({
        subject: "Should we close your Build Plan?",
        heading: "Last reminder",
        paragraphs: [
          "We haven't heard back, so this is the last reminder we'll send. If the timing is wrong, no problem: your plan stays on file for when you're ready.",
          "If something in the scope or price doesn't fit, reply and tell us.",
        ],
        cta: "Review and sign",
      }),
    },
  ],
  signed_unpaid: [
    {
      afterHours: 24,
      copy: c => ({
        subject: "One step left: your deposit",
        heading: "Your agreement is signed",
        paragraphs: [
          `Your agreement${forCompany(c)} is on file. Pay the 10% deposit to confirm your start date and begin planning.`,
        ],
        cta: "Pay deposit",
      }),
    },
    {
      afterHours: 72,
      copy: () => ({
        subject: "Your build is waiting on the deposit",
        heading: "Planning starts with the deposit",
        paragraphs: [
          "Your signed agreement is on file, but planning can't begin until the 10% deposit is paid. It takes about a minute.",
        ],
        cta: "Pay deposit",
      }),
    },
  ],
};

export function formatState(sequence: Sequence, sent: number): string {
  return `${sequence}:${sent}`;
}

function parseState(raw: string): { stopped: boolean; sequence: string; sent: number } {
  const s = (raw || "").trim();
  if (s === STOP) return { stopped: true, sequence: "", sent: 0 };
  const [sequence, n] = s.split(":");
  return { stopped: false, sequence: sequence || "", sent: Number(n) || 0 };
}

// Index of the step due now for an item that entered this sequence's stage at
// `enteredAt`, or null when nothing is due (too early, finished, or unsubscribed).
export function dueStep(sequence: Sequence, enteredAt: number, rawState: string, now: number): number | null {
  if (!Number.isFinite(enteredAt) || enteredAt < FOLLOW_UPS_START) return null;
  const state = parseState(rawState);
  if (state.stopped) return null;
  const sent = state.sequence === sequence ? state.sent : 0;
  const step = SEQUENCES[sequence][sent];
  if (!step) return null;
  return now - enteredAt >= step.afterHours * HOUR ? sent : null;
}

export function copyFor(sequence: Sequence, step: number, ctx: Ctx): FollowUpCopy {
  return SEQUENCES[sequence][step].copy(ctx);
}
