import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import WordMark from "@/components/WordMark";
import SiteFooter from "@/components/SiteFooter";
import Screenshot from "@/components/Screenshot";

export const metadata: Metadata = {
  title: "Case study: the account manager portal behind Retaliator Nation",
  description:
    "A sales portal built for a cyber security reseller: account managers work their book in one place, managers see the whole team on one page, and nobody edits anyone else's numbers.",
  alternates: { canonical: "/case-study/am-portal" },
};

// The one real system we can show in full. Written for prospects deciding
// whether a 30-day build produces something their team would actually use, so
// it stays concrete: module names, access rules, and the trade-offs, not
// adjectives. Staff names from the source repo are deliberately left out.

const FACTS = [
  ["Client", "Cyber Retaliator Solutions"],
  ["What it is", "An internal sales portal, called the AM portal, for a cyber security reseller"],
  ["Who uses it", "Account managers, their managers, and leadership"],
  ["Built on", "Next.js, Postgres, Microsoft 365, Monday.com, vendor APIs"],
];

const SCALE = [
  ["117", "screens"],
  ["390", "API endpoints"],
  ["~318k", "lines of TypeScript"],
  ["45", "modules in the account manager area"],
];

const AM_MODULES: [string, string][] = [
  [
    "My Accounts",
    "Every company an account manager owns, with the contacts, the open work, and the last thing that happened on each one.",
  ],
  [
    "Open Leads",
    "The top of the funnel as a call list. About half the rows arrive with no phone or email on them, so the first control on the page splits reachable from not reachable. That split is the page, not a filter hidden in a dropdown.",
  ],
  [
    "Speed Calling",
    "Deliberately separate from Open Leads: this works contacts at accounts the rep already owns, one after another, with the dial, the note, and the next step in the same view.",
  ],
  [
    "Performance and Pipeline",
    "What is in play, what stage it sits at, and what it is worth, against the target for the period.",
  ],
  [
    "Plans",
    "The quarterly account plan, with deadlines that show as a banner in the portal rather than living in someone's inbox.",
  ],
  [
    "Tenders and Tender Fit",
    "Tenders are dropped in and assessed against what the business can actually deliver. The assessment is a conversation with the source documents behind every answer, not a score you cannot question.",
  ],
  [
    "Proof of Concept",
    "POC requests and their state, so a trial does not quietly stall between the vendor and the customer.",
  ],
  [
    "Solutions",
    "The vendor and product catalogue, mapped to the accounts it fits, so a rep can see what else an account could buy.",
  ],
  [
    "Academy",
    "Vendor and product training, tracked per person, because accreditation is what lets a reseller sell.",
  ],
  [
    "Leaderboard and Feedback",
    "Standing across the team, and a route for reps to say what is wrong with the system itself.",
  ],
];

const MANAGER_PANELS: [string, string][] = [
  ["Plan board", "Whose account plans are in, late, or missing."],
  ["Pipeline", "Every open deal across the team, bucketed by stage."],
  ["Targets and Won", "Target against closed, per person and per period."],
  ["Activity", "Calls, emails, and meetings logged, with the trend rather than a single number."],
  ["Intent", "Accounts showing buying signals, and the action taken on each."],
  ["Follow-through", "Where someone said they would do something and the record does not show it happening."],
  ["Scorecard", "The per-person view a one-to-one is actually run from."],
  ["Discipline", "Hygiene: stale stages, missing next steps, deals with no date."],
  ["Adoption", "Who is using the portal, and which parts they never open."],
  ["Training", "Accreditation progress against what the team is expected to hold."],
];

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{children}</p>;
}

function Rows({ items }: { items: [string, string][] }) {
  return (
    <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {items.map(([term, body]) => (
        <div key={term} className="py-4 sm:flex sm:gap-6">
          <dt className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white sm:w-52">{term}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:mt-0">{body}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AmPortalCaseStudy() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="px-5 py-10">
        <article className="mx-auto max-w-3xl">
          <Link href="/" aria-label="The Start Up home" className="inline-block">
            <WordMark className="scale-75 origin-left" />
          </Link>

          <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Case study
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            The account manager portal behind Retaliator Nation
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            A cyber security reseller with a sales team, a CRM, and a pipeline nobody trusted. We built the layer
            that runs the sales cycle: one place for a rep to work their book, one page for a manager to see the
            whole team, and clear rules about who is allowed to change what.
          </p>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <dl className="space-y-3">
              {FACTS.map(([term, body]) => (
                <div key={term} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                  <dt className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:w-24 sm:pt-0.5">
                    {term}
                  </dt>
                  <dd className="text-sm text-slate-700 dark:text-slate-200">{body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <H2>The problem</H2>
          <P>
            The business was not short of software. It had a CRM, a mailbox, vendor portals, and spreadsheets filling
            the gaps between them. What it did not have was a single place where the sales cycle happened.
          </P>
          <P>
            Leads arrived from several directions and sat there. Half of them had no phone number or email address
            attached, so working the list meant finding out which rows could be called at all before any calling
            started. Pipeline reviews ran on whatever each rep had typed into a spreadsheet that week. A manager
            asking a straight question, like which accounts went quiet after a first meeting, had no way to answer it
            without asking five people and waiting.
          </P>
          <P>
            The brief was not to replace the CRM. It was to make the process around it real, visible, and hard to skip.
          </P>

          <H2>What an account manager gets</H2>
          <P>
            The account manager area is the portal for most people most days. Each module below is a screen a rep
            opens by name, and they exist because a specific part of the job was happening somewhere else.
          </P>
          <Rows items={AM_MODULES} />
          <Screenshot
            src="/case-study/am-dashboard.png"
            alt="The account manager dashboard, showing accounts, open work, and the next action on each."
            caption="The account manager dashboard: the book of accounts, what is open on each, and what happens next."
            wide
          />
          <Screenshot
            src="/case-study/open-leads.png"
            alt="The Open Leads call list, split by whether a lead has contact details."
            caption="Open Leads. The reachable and not reachable split is the first thing on the page, because it decides what the next hour looks like."
            wide
          />

          <H2>What a manager gets</H2>
          <P>
            The manager dashboard is one page, not a set of tabs. That was a decision, and the reason is simple: a
            manager preparing for a one-to-one or a forecast call reads down a page. Tabs make them remember where
            things are and click to find out whether anything is wrong.
          </P>
          <P>
            One page with that much on it would normally be slow, so each section loads on its own and fills in as it
            arrives rather than holding the rest of the page hostage. Three panels are expensive enough that they do
            not run at all until the manager opens them: follow-through, intent, and training. Most days nobody opens
            all three, and the page is quick because of it.
          </P>
          <Rows items={MANAGER_PANELS} />
          <Screenshot
            src="/case-study/manager-dashboard.png"
            alt="The manager dashboard with its person and period controls at the top and panels down the page."
            caption="The manager dashboard. Person and period are set once at the top, and every panel below answers for that selection."
            wide
          />
          <P>
            Person and period are separate controls, on purpose. Managers do not only ask how the team did last
            quarter. They ask how one person did last quarter, how the team is doing this month, and how that compares
            to the month before. Tying the two together would have meant a filter combination nobody could reach.
          </P>
          <Screenshot
            src="/case-study/scorecard.png"
            alt="The per-person scorecard panel used to run a one-to-one."
            caption="The scorecard. This is the panel a one-to-one is actually run from, which is why it exists separately from the pipeline table."
          />

          <H2>Who can see what, and who can change it</H2>
          <P>
            A portal with everyone's numbers in it needs rules, and vague rules get worked around. Three things are
            true in this system:
          </P>
          <ul className="mt-4 space-y-3 pl-5 text-[15px] leading-relaxed text-slate-600 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-600">
            <li className="list-disc">A rep sees their own accounts and their own numbers.</li>
            <li className="list-disc">
              A manager sees their roster. Leadership sees everyone. Both of those are read-only views of someone
              else's work.
            </li>
            <li className="list-disc">
              Acting on a record, logging a call, moving a stage, editing a plan, is gated on it being your own record.
              Looking at someone else's book never turns into editing it by accident.
            </li>
          </ul>
          <P>
            That scoping is resolved in one place rather than re-checked on every screen, which is what stops the
            twentieth screen from quietly getting it wrong.
          </P>

          <H2>What it connects to</H2>
          <P>
            The portal is not an island. It reads and writes the systems the business already paid for: the Microsoft
            365 mailbox and calendar, Monday.com boards, the vendor portals the resale business runs on, and the
            enrichment sources used to fill in the missing contact details on those unreachable leads. Where a vendor
            had no usable API, the integration is honest about it and the portal asks a person to confirm instead of
            pretending it knows.
          </P>
          <Screenshot
            src="/case-study/tender-fit.png"
            alt="A tender assessment with the source documents behind each answer."
            caption="Tender assessment. Every answer can be traced back to the document it came from, so a no can be argued with."
            wide
          />

          <H2>Where it got to</H2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SCALE.map(([n, label]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-white">{n}</div>
                <div className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400">{label}</div>
              </div>
            ))}
          </div>
          <P>
            Those are counts from the codebase, not a performance claim. The portal did not arrive at that size in
            thirty days, and we are not going to suggest it did. It started as a smaller build, around the pipeline
            and the call list, and grew one phase at a time as the team used it and asked for the next thing. That is
            the normal shape of this work.
          </P>

          <H2>What we would do differently</H2>
          <P>
            Two things. The adoption panel, which shows which parts of the portal nobody opens, should have been built
            first rather than later. It is the panel that tells you which of your own features were a waste, and
            having it earlier would have saved building at least one of them.
          </P>
          <P>
            The second is scope discipline on the manager side. Managers ask good questions, and every good question
            looks like one more panel. Some of those answers belonged in an existing panel instead of next to it.
          </P>

          <div className="mt-14 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Want the same thing pointed at your sales cycle?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Start with the Build Plan. It is a short set of questions, no call, and it ends with a fixed scope, a
              fixed price, and a ship date.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/calculator?step=buildplan"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400"
              >
                Start your Build <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
              >
                Run the free audit first <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}
