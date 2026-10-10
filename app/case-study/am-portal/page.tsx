import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Boxes, Handshake, Repeat, Users } from "lucide-react";
import WordMark from "@/components/WordMark";
import SiteFooter from "@/components/SiteFooter";
import { AmDashboard, Figure, ManagerDashboard, OpenLeads, Scorecard, TenderFit } from "@/components/case-study/PortalMocks";

export const metadata: Metadata = {
  title: "Case study: a sales portal for a cyber security reseller",
  description:
    "One place for the whole sales cycle: account managers work their book, managers see the team on one page, follow-up stops depending on memory, and vendor work sits beside the deals it belongs to.",
  alternates: { canonical: "/case-study/am-portal" },
};

// The one real system we can show in full. Written for prospects deciding
// whether a 30-day build produces something their team would actually use, so
// it stays concrete: module names, access rules, and the trade-offs, not
// adjectives.
//
// The client is anonymous here: no company name, no product name, no staff
// names. What makes the page convincing is the detail of the build, not whose
// logo is on it, and naming a client is theirs to agree to rather than ours to
// assume.
//
// The screens are rendered from the portal's own structure with invented data,
// and each caption says so. Results below are described as what the system
// changed, in the client's own assessment. Where a measured number belongs,
// there is a number only if the client gave us one.

const FACTS = [
  ["Client", "A cyber security reseller and managed service provider, named on request"],
  ["What it is", "An internal sales portal for their account managers"],
  ["Who uses it", "Account managers, their managers, and leadership"],
  ["Built on", "Next.js, Postgres, Microsoft 365, Monday.com, vendor APIs"],
];

const RESULTS = [
  {
    icon: Users,
    title: "The team actually opens it",
    body:
      "Engagement was the whole risk. Internal tools get built and then quietly abandoned, so the portal measures its own use: who was last active, which sections get opened, which never do. That panel is how the client can say adoption went up rather than hope it did, and it is why features nobody touched got cut instead of defended.",
  },
  {
    icon: Handshake,
    title: "Vendor and partner work stopped living in inboxes",
    body:
      "A reseller's revenue runs through its vendors. Accreditations, proof-of-concept requests, tender responses and the product catalogue now sit against the accounts they belong to, so a manager can see which partner commitments are open and who owns each one without asking around.",
  },
  {
    icon: Repeat,
    title: "Follow-up stopped depending on who remembered",
    body:
      "Every deal carries a next step and an owner, and the follow-through panel exists specifically to surface the gap between what someone said they would do and what the record shows happened. Chasing is no longer a personality trait of the best rep on the team.",
  },
  {
    icon: Boxes,
    title: "One environment instead of six",
    body:
      "Lead list, call work, pipeline, plans, tenders, POCs, training and the numbers behind all of it are in one place, reading from the mailbox, the boards and the vendor systems the business already paid for. Nobody reconciles a spreadsheet to find out where the quarter stands.",
  },
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
    "100 Day Plans",
    "The account plan each person commits to, with deadlines that show as a banner in the portal rather than living in someone's inbox.",
  ],
  [
    "Tenders and Tender Fit",
    "Tenders are dropped in and assessed against what the business can actually deliver, with the source documents behind every answer.",
  ],
  [
    "Proof of Concept",
    "POC requests and their state, so a vendor trial does not quietly stall between the partner and the customer.",
  ],
  [
    "Solutions",
    "The vendor and product catalogue, mapped to the accounts it fits, so a rep can see what else an account could buy.",
  ],
  [
    "Academy",
    "Vendor and product training tracked per person, because accreditation is what lets a reseller sell in the first place.",
  ],
  [
    "Leaderboard and Feedback",
    "Standing across the team, and a route for reps to say what is wrong with the system itself.",
  ],
];

const MANAGER_SECTIONS: [string, string][] = [
  ["Scorecard", "One row per person, pulling the headline figure out of every section below it. The panel a one-to-one is run from."],
  ["100 Day Plans", "Whose plan is in, late, or missing."],
  ["Pipeline", "Every open deal, grouped by how close to money it is: early, priced, proving, negotiating, committed."],
  ["Targets", "Target against the period, per person and for the team."],
  ["Closed as won", "What actually landed, so the forecast can be checked against it."],
  ["Activity", "Calls, emails and meetings logged, shown as a trend rather than a single number."],
  ["Daily discipline", "The habits behind the results: target lists worked, calls answered, the calls-to-won funnel."],
  ["Academy", "Required courses, who is overdue, who is certified."],
  ["Tool adoption", "Who is using the portal and which parts they never open."],
  ["Follow-through", "Where someone said they would do something and the record does not show it happening."],
  ["Intent", "Accounts showing buying signals, and what was done about each."],
  ["Training", "Course delivery across the business, which is the one section not scoped by who owns the account."],
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
            The sales portal we built for a cyber security reseller
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            A sales team, a CRM, and a pipeline nobody trusted. We built the layer that runs the sales cycle: one
            place for a rep to work their book, one page for a manager to see the whole team, and follow-up that
            no longer depends on who remembered.
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

          <H2>What changed</H2>
          <P>
            Four things, in the client's own assessment. Each one is a thing the system makes happen, not a mood
            it improved.
          </P>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {RESULTS.map(r => (
              <div
                key={r.title}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <r.icon className="h-5 w-5 text-teal-500" strokeWidth={2} />
                <h3 className="mt-3 text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{r.body}</p>
              </div>
            ))}
          </div>

          <H2>The problem</H2>
          <P>
            The business was not short of software. It had a CRM, a mailbox, vendor portals, and spreadsheets
            filling the gaps between them. What it did not have was a single place where the sales cycle happened.
          </P>
          <P>
            Leads arrived from several directions and sat there. Half of them had no phone number or email address
            attached, so working the list meant first finding out which rows could be called at all. Pipeline
            reviews ran on whatever each rep had typed into a spreadsheet that week. A manager asking a straight
            question, like which accounts went quiet after a first meeting, had no way to answer it without asking
            five people and waiting.
          </P>
          <P>The brief was not to replace the CRM. It was to make the process around it real, visible, and hard to skip.</P>

          <H2>What an account manager gets</H2>
          <P>
            This is the part of the portal most people use most days. Each module below is a screen a rep opens by
            name, and each exists because that part of the job was previously happening somewhere else.
          </P>
          <Rows items={AM_MODULES} />
          <Figure caption="The account manager's home: the book of accounts, what is open on each, and what happens next. Rebuilt here from the portal's own layout, with invented accounts and figures.">
            <AmDashboard />
          </Figure>
          <Figure caption="Open Leads. The reachable and not reachable split is the first thing on the page because it decides what the next hour looks like: calling, or finding numbers. Sample data.">
            <OpenLeads />
          </Figure>

          <H2>What a manager gets</H2>
          <P>
            The manager dashboard is one page, not a set of tabs. That was a decision. A manager preparing for a
            one-to-one or a forecast call reads down a page, where tabs make them remember where things are and
            click to find out whether anything is wrong.
          </P>
          <P>
            One page carrying twelve sections would normally be slow, so each section loads on its own and fills in
            as it arrives instead of holding up the rest. Four of them are expensive enough that the page does not
            query them at all until a manager opens one: tool adoption, follow-through, intent and training. Closed
            means not fetched, not hidden with CSS, which is the entire point.
          </P>
          <Rows items={MANAGER_SECTIONS} />
          <Figure caption="The manager dashboard. Person and period are set once at the top, the jump bar scrolls rather than switches, and the heavy sections sit closed until asked for. Sample team and figures.">
            <ManagerDashboard />
          </Figure>
          <P>
            Person and period are separate controls, on purpose. Managers do not only ask how the team did last
            quarter. They ask how one person did last quarter, how the team is doing this month, and how that
            compares to the month before. Tying the two axes together would have left questions nobody could reach.
          </P>
          <Figure caption="The scorecard. One row per person, and a deliberate fourth mark for too early to judge, so an unmeasured thing never reads as a bad result. Sample data.">
            <Scorecard />
          </Figure>

          <H2>Who can see what, and who can change it</H2>
          <P>
            A portal with everyone's numbers in it needs rules, and vague rules get worked around. Three things are
            true here:
          </P>
          <ul className="mt-4 space-y-3 pl-5 text-[15px] leading-relaxed text-slate-600 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-600">
            <li className="list-disc">A rep sees their own accounts and their own numbers.</li>
            <li className="list-disc">
              A manager sees their roster and leadership sees everyone. Both are read-only views of someone else's
              work.
            </li>
            <li className="list-disc">
              Acting on a record, logging a call, moving a stage, editing a plan, is gated on it being your own
              record. Looking at someone else's book never turns into editing it by accident.
            </li>
          </ul>
          <P>
            That scoping is resolved in one place rather than re-checked on every screen, which is what stops the
            twentieth screen from quietly getting it wrong.
          </P>

          <H2>Everything in one environment</H2>
          <P>
            The portal is not an island, and the point of it was never to add a seventh system. It reads and writes
            what the business already pays for: the Microsoft 365 mailbox and calendar, the Monday.com boards, the
            vendor portals the resale business runs on, and the enrichment sources that fill in the missing contact
            details on all those unreachable leads. Where a vendor had no usable API, the integration says so and
            asks a person to confirm rather than pretending it knows.
          </P>
          <P>
            Partner work is the clearest case. Accreditations, POC requests and tender responses used to live in
            mailboxes and vendor sites, which meant nobody could see the full commitment to a partner in one view.
            Now a tender is assessed in the portal against the capability documents, and the answer cites the
            document it came from, so a no can be argued with.
          </P>
          <Figure caption="Tender assessment, with the source document behind each line. The verdict is a conversation, not a score you cannot question. Sample tender.">
            <TenderFit />
          </Figure>

          <H2>Where it got to</H2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["117", "screens"],
              ["390", "API endpoints"],
              ["12", "manager sections on one page"],
              ["45", "modules for account managers"],
            ].map(([n, label]) => (
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
            Those are counts from the codebase, not performance claims. The portal did not arrive at that size in
            thirty days and we are not going to suggest it did. It started smaller, around the pipeline and the call
            list, and grew a phase at a time as the team used it and asked for the next thing. That is the normal
            shape of this work, and it is the shape we would propose for you.
          </P>

          <H2>What we would do differently</H2>
          <P>
            Two things. The adoption panel, the one that shows which parts of the portal nobody opens, should have
            been built first rather than later. It is the panel that tells you which of your own features were a
            waste, and having it earlier would have saved building at least one of them.
          </P>
          <P>
            The second is scope discipline on the manager side. Managers ask good questions, and every good question
            looks like one more panel. Some of those answers belonged inside an existing panel rather than next to
            it.
          </P>

          <div className="mt-14 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Want the same thing pointed at your sales cycle?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Start with the Build Plan. A short set of questions, no call, and it ends with a fixed scope, a fixed
              price and a ship date.
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
