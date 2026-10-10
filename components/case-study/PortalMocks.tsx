// Renderings of the portal's screens for the case study.
//
// These are rebuilt here rather than screenshotted. The structure is taken from
// the real application: the manager dashboard's twelve sections and their order,
// the five pipeline buckets and their colours, the reachable split on Open
// Leads, and the four scorecard marks are all what the code actually defines.
// The numbers and the people are invented, and every caption on the page says
// so. Nothing here is a claim about a real customer's figures.
//
// Server components on purpose: no client JS, nothing animated, so the case
// study stays a page you read rather than a page that performs.

import {
  AlarmClock, Activity, BookOpenCheck, Brain, ClipboardList, FileText, Gauge,
  GraduationCap, ListChecks, Lock, MonitorCheck, Phone, Target, TrendingUp, Trophy,
} from "lucide-react";

/* ---------------------------------------------------------------- scaffolding */

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="ml-1.5 truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">{title}</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px] p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
}

export function Figure({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure className="my-7">
      {children}
      <figcaption className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{caption}</figcaption>
    </figure>
  );
}

const Pill = ({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "teal" | "amber" | "rose" }) => {
  const tones = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
};

const Th = ({ children, right = false }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`pb-1.5 font-medium text-slate-400 dark:text-slate-500 ${right ? "text-right" : "text-left"}`}>{children}</th>
);

const Td = ({ children, right = false, strong = false }: { children: React.ReactNode; right?: boolean; strong?: boolean }) => (
  <td
    className={`py-1.5 ${right ? "text-right tabular-nums" : ""} ${
      strong ? "font-medium text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
    }`}
  >
    {children}
  </td>
);

const rowLine = "border-t border-slate-100 dark:border-slate-800";

/* ------------------------------------------------- 1. account manager home */

const BOOK = [
  ["Halvorsen Group", "4 open", "$182k", "Renewal call booked Thu", "2d"],
  ["Ardent Logistics", "2 open", "$96k", "Send revised quote", "today"],
  ["Pentland Civil", "1 open", "$41k", "Nothing scheduled", "19d"],
  ["Brightwater Health", "3 open", "$214k", "POC review with vendor", "1d"],
  ["Castellan Finance", "1 open", "$57k", "Waiting on their security team", "6d"],
];

export function AmDashboard() {
  return (
    <Frame title="sales-portal / dashboard">
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px]">
        {["Dashboard", "My Accounts", "Open Leads", "Speed Calling", "Pipeline", "Plans", "Tenders", "Academy"].map((t, i) => (
          <span
            key={t}
            className={`rounded px-2 py-1 ${
              i === 0
                ? "bg-slate-900 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          ["38", "accounts owned"],
          ["$1.24M", "open pipeline"],
          ["7", "actions due today"],
        ].map(([n, l]) => (
          <div key={l} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <div className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{n}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{l}</div>
          </div>
        ))}
      </div>

      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <Th>Account</Th>
            <Th>Deals</Th>
            <Th right>Value</Th>
            <Th>Next action</Th>
            <Th right>Last touch</Th>
          </tr>
        </thead>
        <tbody>
          {BOOK.map(([acct, deals, value, next, touch]) => (
            <tr key={acct} className={rowLine}>
              <Td strong>{acct}</Td>
              <Td>{deals}</Td>
              <Td right>{value}</Td>
              <Td>{next === "Nothing scheduled" ? <Pill tone="amber">Nothing scheduled</Pill> : next}</Td>
              <Td right>{touch === "19d" ? <Pill tone="rose">19d</Pill> : touch}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

/* --------------------------------------------------------- 2. open leads */

const LEADS = [
  ["Verity Manufacturing", "Trade show", "3d ago", "Direct line", "Call today"],
  ["Kestrel Shipping", "Web form", "1d ago", "Email only", "Call today"],
  ["Ormond Legal", "Partner referral", "9d ago", "Not on the lead", "Not scheduled"],
  ["Thornhill Retail", "List import", "22d ago", "Not on the lead", "Never"],
  ["Sable Energy", "Web form", "14d ago", "Not on the lead", "Never"],
];

export function OpenLeads() {
  return (
    <Frame title="sales-portal / open-leads">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-900 dark:text-white">Open Leads</div>
        <div className="flex gap-1 text-[10px]">
          {["Mine", "Everyone", "Unassigned"].map((t, i) => (
            <span
              key={t}
              className={`rounded px-2 py-1 ${
                i === 0
                  ? "bg-slate-900 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* The split is the page, not a filter. It decides whether the next hour
          is calling or is finding numbers. */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border-2 border-teal-500 bg-teal-50 px-3 py-2 dark:bg-teal-900/20">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-semibold text-teal-700 dark:text-teal-300">62</span>
            <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300">Reachable now</span>
          </div>
          <div className="mt-0.5 text-[10px] text-teal-600/70 dark:text-teal-400/70">Has a phone number or an email</div>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-semibold text-slate-700 dark:text-slate-200">71</span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">No contact details</span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">Needs enrichment before anyone calls</div>
        </div>
      </div>

      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <Th>Company</Th>
            <Th>Source</Th>
            <Th>Posted</Th>
            <Th>Contact</Th>
            <Th>Next step</Th>
          </tr>
        </thead>
        <tbody>
          {LEADS.map(([co, src, posted, contact, next]) => (
            <tr key={co} className={rowLine}>
              <Td strong>{co}</Td>
              <Td>{src}</Td>
              <Td>{posted}</Td>
              <Td>{contact === "Not on the lead" ? <Pill>Not on the lead</Pill> : contact}</Td>
              <Td>
                {next === "Call today" ? (
                  <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400">
                    <Phone className="h-2.5 w-2.5" /> {next}
                  </span>
                ) : (
                  <Pill tone={next === "Never" ? "rose" : "amber"}>{next}</Pill>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

/* ------------------------------------------------- 3. manager dashboard */

// The real section list and order, including which four are heavy enough that
// the page does not query them until a manager opens them.
const SECTIONS = [
  { label: "Scorecard", icon: Gauge },
  { label: "100 Day Plans", icon: ClipboardList },
  { label: "Pipeline", icon: TrendingUp },
  { label: "Targets", icon: Target },
  { label: "Closed as won", icon: Trophy },
  { label: "Activity", icon: Activity },
  { label: "Daily discipline", icon: ListChecks },
  { label: "Academy", icon: BookOpenCheck },
  { label: "Tool adoption", icon: MonitorCheck, heavy: true },
  { label: "Follow-through", icon: AlarmClock, heavy: true },
  { label: "Intent", icon: Brain, heavy: true },
  { label: "Training", icon: GraduationCap, heavy: true },
];

const BUCKETS = [
  { label: "Early", pct: 31, cls: "bg-slate-400 dark:bg-slate-500" },
  { label: "Priced", pct: 24, cls: "bg-sky-500" },
  { label: "Proving", pct: 18, cls: "bg-violet-500" },
  { label: "Negotiating", pct: 15, cls: "bg-amber-500" },
  { label: "Committed", pct: 12, cls: "bg-emerald-500" },
];

const TEAM = ["Nadia R.", "Tom B.", "Priya S.", "Daniel O.", "Kate M."];

export function ManagerDashboard() {
  return (
    <Frame title="sales-portal / manager">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-900 dark:text-white">Manager Dashboard</div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-400 dark:text-slate-500">Showing</span>
          <span className="rounded border border-slate-200 px-2 py-1 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Whole team
          </span>
          <div className="flex overflow-hidden rounded border border-slate-200 dark:border-slate-700">
            <span className="bg-slate-900 px-2 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900">Quarter</span>
            <span className="px-2 py-1 text-slate-500 dark:text-slate-400">Month</span>
          </div>
        </div>
      </div>

      {/* Jump bar: every section is on the page, so this scrolls rather than switches. */}
      <div className="mb-3 flex flex-wrap gap-1 border-b border-slate-200 pb-3 dark:border-slate-700">
        {SECTIONS.map(s => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-slate-500 dark:text-slate-400"
          >
            <s.icon className="h-2.5 w-2.5" />
            {s.label}
            {s.heavy && <Lock className="h-2 w-2 text-slate-300 dark:text-slate-600" />}
          </span>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
        <div className="hidden sm:block">
          <div className="mb-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">People</div>
          {TEAM.map((p, i) => (
            <div
              key={p}
              className={`rounded px-2 py-1.5 text-[11px] ${
                i === 0
                  ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {p}
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
            <TrendingUp className="h-3 w-3" /> Pipeline
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full">
            {BUCKETS.map(b => (
              <div key={b.label} className={b.cls} style={{ width: `${b.pct}%` }} />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {BUCKETS.map(b => (
              <span key={b.label} className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${b.cls}`} /> {b.label}
              </span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["Target", "$2.10M"],
              ["Committed", "$0.72M"],
              ["Closed as won", "$1.38M"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 dark:text-slate-500">{l}</div>
                <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{v}</div>
              </div>
            ))}
          </div>

          {/* The four heavy sections sit closed. Closed means not queried. */}
          <div className="mt-3 space-y-1.5">
            {["Follow-through", "Intent"].map(l => (
              <div
                key={l}
                className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-2.5 py-2 dark:border-slate-700"
              >
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{l}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Not loaded yet. Opens when you click.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------ 4. scorecard */

// The four marks the real scorecard uses, including the one that says a number
// would be misleading rather than guessing at it.
const MARKS = {
  ok: ["On track", "bg-emerald-500"],
  look: ["Worth a look", "bg-amber-500"],
  bad: ["Needs attention", "bg-rose-500"],
  none: ["No mark", "bg-slate-300 dark:bg-slate-600"],
} as const;

type Mark = keyof typeof MARKS;

const SCORES: [string, Mark, Mark, Mark, Mark, string][] = [
  ["Nadia R.", "ok", "ok", "ok", "look", "$438k"],
  ["Tom B.", "ok", "look", "ok", "ok", "$310k"],
  ["Priya S.", "look", "ok", "bad", "ok", "$286k"],
  ["Daniel O.", "bad", "look", "look", "bad", "$141k"],
  ["Kate M.", "none", "ok", "none", "ok", "$95k"],
];

const Dot = ({ m }: { m: Mark }) => (
  <span className="inline-flex items-center gap-1">
    <span className={`h-2 w-2 rounded-full ${MARKS[m][1]}`} />
    <span className="hidden text-[10px] text-slate-500 sm:inline dark:text-slate-400">{MARKS[m][0]}</span>
  </span>
);

export function Scorecard() {
  return (
    <Frame title="sales-portal / manager #scorecard">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
        <Gauge className="h-3 w-3" /> Scorecard
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <Th>Person</Th>
            <Th>Plan</Th>
            <Th>Pipeline</Th>
            <Th>Activity</Th>
            <Th>Discipline</Th>
            <Th right>Won</Th>
          </tr>
        </thead>
        <tbody>
          {SCORES.map(([who, plan, pipe, act, disc, won]) => (
            <tr key={who} className={rowLine}>
              <Td strong>{who}</Td>
              <Td><Dot m={plan} /></Td>
              <Td><Dot m={pipe} /></Td>
              <Td><Dot m={act} /></Td>
              <Td><Dot m={disc} /></Td>
              <Td right strong>{won}</Td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
        No mark means too early to judge or not measured, which is deliberately not the same as a bad mark.
      </p>
    </Frame>
  );
}

/* ----------------------------------------------------------- 5. tender fit */

const CRITERIA: [string, string, "yes" | "no" | "part", string][] = [
  ["Mandatory accreditation held", "Yes, current to Mar 2027", "yes", "Accreditation register, row 12"],
  ["Three comparable references", "Two supplied, one outside sector", "part", "Reference pack, p.2 to p.5"],
  ["24/7 response commitment", "Not offered on this service line", "no", "Service catalogue, s.4.1"],
  ["B-BBEE level required", "Level 2, meets the floor", "yes", "Certificate, issued Aug 2026"],
  ["Delivery inside 60 days", "Possible with one subcontractor", "part", "Capacity plan, Q4 sheet"],
];

const VERDICT = {
  yes: ["Meets", "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"],
  part: ["Partial", "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"],
  no: ["Gap", "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"],
} as const;

export function TenderFit() {
  return (
    <Frame title="sales-portal / tender-fit">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white">
            Municipal network refresh, closing 14 Nov
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
            Assessed against the capability pack and the accreditation register
          </div>
        </div>
        <span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Bid with conditions
        </span>
      </div>

      <div className="space-y-1.5">
        {CRITERIA.map(([q, a, v, source]) => (
          <div key={q} className="rounded-lg border border-slate-200 px-2.5 py-2 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-800 dark:text-slate-100">{q}</span>
              <span className={`flex-none rounded px-1.5 py-0.5 text-[10px] font-semibold ${VERDICT[v][1]}`}>
                {VERDICT[v][0]}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{a}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
              <FileText className="h-2.5 w-2.5" /> {source}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
        Every line cites the document it came from, so a Gap can be argued with rather than just accepted.
      </p>
    </Frame>
  );
}
