"use client";
import React, { useState } from "react";
import {
  ArrowRight, Search, Filter, Zap, Users, Clock,
  TrendingUp, BarChart2, Check, Bell, ChevronRight,
  Layers, RefreshCw, ShieldCheck, GitMerge,
} from "lucide-react";
import WordMark from "./WordMark";

// ─── Industry data ────────────────────────────────────────────────────────────

const INDUSTRIES = [
  {
    id: "saas",
    label: "SaaS / Software",
    icon: "⚡",
    tagline: "Turn free trials into revenue before the competition calls",
    stages: [
      {
        name: "New Trial",
        count: 14,
        leads: [
          { company: "Fintrack", contact: "Sarah Chen", value: "$24k /yr", days: 1, heat: "hot", note: "High feature usage on day 1" },
          { company: "Loopback AI", contact: "Tom Rivera", value: "$8.4k /yr", days: 2, heat: "hot", note: "Invited 3 teammates already" },
        ],
      },
      {
        name: "Demo Scheduled",
        count: 7,
        leads: [
          { company: "CloudNine", contact: "Emma Park", value: "$36k /yr", days: 3, heat: "warm", note: "Thursday 2pm confirmed" },
          { company: "Nexus Ops", contact: "James Lim", value: "$60k /yr", days: 5, heat: "warm", note: "Invited VP of Eng to call" },
        ],
      },
      {
        name: "Proposal Sent",
        count: 4,
        leads: [
          { company: "Mosaic Labs", contact: "Priya Sharma", value: "$96k /yr", days: 2, heat: "hot", note: "Asked about enterprise add-ons" },
          { company: "Strata HQ", contact: "Will Ford", value: "$48k /yr", days: 8, heat: "cold", note: "No reply — follow up today" },
        ],
      },
      {
        name: "Negotiation",
        count: 3,
        leads: [
          { company: "Apex Digital", contact: "Laura Moss", value: "$120k /yr", days: 4, heat: "warm", note: "Requested 10% discount" },
          { company: "Orbit SaaS", contact: "Ryan Cho", value: "$72k /yr", days: 1, heat: "hot", note: "Legal reviewing contract" },
        ],
      },
    ],
    metrics: [
      { label: "Avg. trial-to-demo", value: "34%", gain: "+18 pts with auto-routing" },
      { label: "Demo-to-close rate", value: "28%", gain: "+11 pts with follow-up seq." },
      { label: "Days to close", value: "22 days", gain: "−9 days with automation" },
    ],
    insights: [
      { icon: Clock, title: "Speed-to-demo wins the deal", body: "Studies show 50% of B2B SaaS deals go to the first vendor that schedules a demo. Auto-assigning inbound trials to the nearest available rep cuts response time from hours to minutes." },
      { icon: TrendingUp, title: "Usage signals predict closings", body: "Leads who invite teammates, configure integrations, or hit key features in the first 48 hours are 3× more likely to convert. Score them automatically and escalate to your best closer." },
      { icon: Bell, title: "Drip at the right moment, not on a schedule", body: "Trigger follow-up based on activity — a rep gets notified the moment a trial user returns after 5 days of silence, not because a calendar reminder fired." },
    ],
    automations: [
      "Trial signup → rep assigned by territory within 2 minutes",
      "Day 3 of no activity → automated re-engagement email",
      "Demo request → calendar link sent instantly",
      "Proposal opened → rep notified in real time",
      "No reply after 5 days → escalation flag to team lead",
      "Won deal → CSM handoff checklist triggered",
    ],
  },

  {
    id: "agency",
    label: "Agency / Marketing",
    icon: "🎯",
    tagline: "Stop losing retainer clients to slow proposals and poor follow-through",
    stages: [
      {
        name: "New Inquiry",
        count: 11,
        leads: [
          { company: "Summit Brands", contact: "Alex Thompson", value: "$84k /yr", days: 1, heat: "hot", note: "Inbound — came from Google Ads case study" },
          { company: "Coastal Media", contact: "Nina Reyes", value: "$36k project", days: 3, heat: "warm", note: "Referral from Bloom client" },
        ],
      },
      {
        name: "Discovery",
        count: 6,
        leads: [
          { company: "Urban Digital", contact: "David Lee", value: "$156k /yr", days: 2, heat: "hot", note: "Discovery call done — big brief" },
          { company: "Pinnacle Foods", contact: "Rachel Kim", value: "$42k project", days: 6, heat: "warm", note: "Awaiting brief document from client" },
        ],
      },
      {
        name: "Proposal Out",
        count: 5,
        leads: [
          { company: "Bloom Co.", contact: "Marcus Webb", value: "$96k /yr", days: 3, heat: "warm", note: "Proposal delivered, reviewing internally" },
          { company: "Tandem Labs", contact: "Sofia Diaz", value: "$28k project", days: 10, heat: "cold", note: "Went quiet — competitor risk" },
        ],
      },
      {
        name: "Contract",
        count: 2,
        leads: [
          { company: "Helix Creative", contact: "James Park", value: "$120k /yr", days: 1, heat: "hot", note: "SOW signing this week" },
          { company: "Radiant Group", contact: "Claire Tan", value: "$60k /yr", days: 4, heat: "warm", note: "Finalising payment terms" },
        ],
      },
    ],
    metrics: [
      { label: "Proposal win rate", value: "41%", gain: "+16 pts tracking referral sources" },
      { label: "Avg. time to proposal", value: "4.2 days", gain: "−2.1 days with templates" },
      { label: "Retainer vs. project mix", value: "62% ret.", gain: "visibility drives upsell" },
    ],
    insights: [
      { icon: Users, title: "Referrals need a pipeline too", body: "68% of agency revenue comes from referrals, but most agencies have zero visibility into where each referral came from or who to thank. Tracking source-to-revenue closes this gap." },
      { icon: Layers, title: "Capacity determines what you can close", body: "Taking on a new retainer only makes sense if you have the hours. Linking your pipeline to your team's capacity means you never over-promise a start date you can't hit." },
      { icon: TrendingUp, title: "Project clients are your next retainer prospects", body: "Clients who complete a successful project are 4× more likely to convert to a retainer within 90 days. Flag them automatically instead of hoping someone remembers to follow up." },
    ],
    automations: [
      "Inquiry received → routed by service type within 1 hour",
      "Discovery call booked → brief template sent automatically",
      "Proposal sent → 3-day and 7-day follow-up reminders",
      "Project delivered → retainer upsell sequence triggered",
      "Client silent >14 days → account health alert to account manager",
      "Referral partner who sent a lead → thank-you task created",
    ],
  },

  {
    id: "professional",
    label: "Professional Services",
    icon: "📋",
    tagline: "Win more mandates, manage capacity, and never miss a referral follow-up",
    stages: [
      {
        name: "Enquiry",
        count: 9,
        leads: [
          { company: "Highfield Group", contact: "Tom Bradley", value: "$45k", days: 1, heat: "hot", note: "Referred by Meridian partner" },
          { company: "Venture Advisory", contact: "Lisa Park", value: "$120k", days: 2, heat: "hot", note: "M&A mandate — time sensitive" },
        ],
      },
      {
        name: "Initial Meeting",
        count: 5,
        leads: [
          { company: "Crestview Mgmt", contact: "Chris West", value: "$28k", days: 4, heat: "warm", note: "Meeting done, awaiting their go-ahead" },
          { company: "Paragon Legal", contact: "Diana Shore", value: "$65k", days: 7, heat: "warm", note: "Conflict check passed — proposal next" },
        ],
      },
      {
        name: "Proposal Sent",
        count: 4,
        leads: [
          { company: "Silverstone Co", contact: "Paul Ngo", value: "$90k", days: 3, heat: "warm", note: "Senior partner reviewing" },
          { company: "Argent Capital", contact: "Helen Marsh", value: "$150k", days: 9, heat: "cold", note: "Stalled — champion on leave" },
        ],
      },
      {
        name: "Engagement Letter",
        count: 3,
        leads: [
          { company: "Fortis Partners", contact: "Rob Chen", value: "$52k", days: 2, heat: "hot", note: "Letter signed, deposit incoming" },
          { company: "Meridian Holdings", contact: "Anna Liu", value: "$200k", days: 1, heat: "hot", note: "Multi-phase engagement confirmed" },
        ],
      },
    ],
    metrics: [
      { label: "Enquiry-to-engagement", value: "39%", gain: "+14 pts with faster follow-up" },
      { label: "Referral source visibility", value: "100%", gain: "vs. 0% before the system" },
      { label: "Avg. time to proposal", value: "5.8 days", gain: "−3.2 days with templates" },
    ],
    insights: [
      { icon: ShieldCheck, title: "Conflict checks shouldn't live in spreadsheets", body: "A centralised system flags potential conflicts of interest automatically before a partner commits time to a pitch — protecting the firm and the client relationship." },
      { icon: Users, title: "Referral relationships are your growth engine", body: "Professional services firms that track referral sources and systematically reciprocate generate 2× more introductions year-over-year than those managing it by memory." },
      { icon: BarChart2, title: "Billable capacity drives pipeline decisions", body: "Linking live pipeline to team availability means partners can see — before accepting a mandate — whether the firm can deliver it in the timeframe promised." },
    ],
    automations: [
      "Enquiry → conflict-check checklist assigned to managing partner",
      "Conflict clear → initial meeting link sent within 24 hours",
      "Meeting complete → proposal template pre-filled and assigned",
      "Engagement letter issued → billing setup task triggered",
      "Matter closed → client satisfaction survey + referral request",
      "Inactive client >90 days → relationship check-in reminder",
    ],
  },

  {
    id: "recruitment",
    label: "Recruitment / Staffing",
    icon: "🔍",
    tagline: "Fill roles faster and build the client relationships that keep coming back",
    stages: [
      {
        name: "Job Brief",
        count: 16,
        leads: [
          { company: "BlueSky Tech", contact: "CTO Role", value: "$45k fee", days: 2, heat: "hot", note: "Exclusive brief — 6-week SLA" },
          { company: "Falcon Media", contact: "Head of Mktg", value: "$32k fee", days: 1, heat: "hot", note: "3 competitors on this role" },
        ],
      },
      {
        name: "Sourcing",
        count: 12,
        leads: [
          { company: "Granite Corp", contact: "CFO Role", value: "$78k fee", days: 5, heat: "warm", note: "8 candidates in pipeline" },
          { company: "Novus Health", contact: "Clinical Dir.", value: "$55k fee", days: 8, heat: "warm", note: "Market tight — expanding search" },
        ],
      },
      {
        name: "Interview Stage",
        count: 8,
        leads: [
          { company: "Redwood Capital", contact: "Portfolio Mgr", value: "$62k fee", days: 3, heat: "hot", note: "Final 2 candidates — decision Fri" },
          { company: "Zephyr FMCG", contact: "Sales Director", value: "$48k fee", days: 6, heat: "warm", note: "Second interviews next week" },
        ],
      },
      {
        name: "Offer / Placed",
        count: 4,
        leads: [
          { company: "Aura Retail", contact: "COO Role", value: "$90k fee", days: 1, heat: "hot", note: "Offer accepted — start date confirmed" },
          { company: "Kinetic Auto", contact: "Ops Manager", value: "$34k fee", days: 2, heat: "hot", note: "Counter-offer risk — monitor" },
        ],
      },
    ],
    metrics: [
      { label: "Avg. time-to-fill", value: "28 days", gain: "vs. industry avg. 42 days" },
      { label: "Offer acceptance rate", value: "84%", gain: "+22 pts with prep sequences" },
      { label: "Client reorder rate", value: "71%", gain: "tracked and actioned" },
    ],
    insights: [
      { icon: Clock, title: "Time-to-fill is your core KPI", body: "Every day a role sits open costs clients roughly 1/250th of the annual salary in lost productivity. Consultants who can consistently deliver in under 30 days earn premium fees and exclusive briefs." },
      { icon: GitMerge, title: "Candidate and client pipelines must connect", body: "The best recruiters know which warm candidates are available before a brief lands. A system that links your candidate bench to active roles means you're shortlisting on day one, not day seven." },
      { icon: RefreshCw, title: "Placed candidates become your next clients", body: "Placements who move into leadership roles are your best source of new mandates. Automated anniversary check-ins at 6 and 12 months keep these relationships alive without manual diary management." },
    ],
    automations: [
      "New brief → search criteria auto-matched against candidate database",
      "Candidate submitted → client acknowledgement and status link sent",
      "Interview confirmed → prep notes sent to candidate automatically",
      "Offer made → counter-offer risk checklist triggered for consultant",
      "Placement at 1 month → check-in survey sent to both client and candidate",
      "Placed candidate anniversary → relationship re-engagement task created",
    ],
  },

  {
    id: "distribution",
    label: "Distribution / Wholesale",
    icon: "📦",
    tagline: "Convert first orders into lifetime accounts with zero manual follow-up",
    stages: [
      {
        name: "New Prospect",
        count: 22,
        leads: [
          { company: "Metro Supplies", contact: "Jake Russo", value: "$180k /yr", days: 2, heat: "hot", note: "Attended trade show — hot lead" },
          { company: "Clearfield Dist.", contact: "Monica Lee", value: "$95k /yr", days: 4, heat: "warm", note: "Currently with competitor" },
        ],
      },
      {
        name: "Quote Sent",
        count: 14,
        leads: [
          { company: "Pacific Foods", contact: "Brian Chow", value: "$420k /yr", days: 1, heat: "hot", note: "Volume quote — decision this week" },
          { company: "Harvest Retail", contact: "Donna Pierce", value: "$72k /yr", days: 9, heat: "cold", note: "Quote not opened — resend?" },
        ],
      },
      {
        name: "Trial Order",
        count: 7,
        leads: [
          { company: "Northgate Foods", contact: "Ian Walsh", value: "$240k /yr", days: 5, heat: "warm", note: "Trial order fulfilled — feedback pending" },
          { company: "Eastern Dist.", contact: "Fiona Marsh", value: "$110k /yr", days: 3, heat: "warm", note: "Second sample order placed" },
        ],
      },
      {
        name: "Active Account",
        count: 38,
        leads: [
          { company: "Summit Whole.", contact: "George Tan", value: "$560k /yr", days: 0, heat: "hot", note: "Reorder every 3 weeks — on track" },
          { company: "Blue Ridge Co.", contact: "Amy Foster", value: "$195k /yr", days: 14, heat: "cold", note: "Overdue reorder — rep to call" },
        ],
      },
    ],
    metrics: [
      { label: "Trial-to-account rate", value: "68%", gain: "+29 pts with post-trial follow-up" },
      { label: "Avg. reorder cycle", value: "21 days", gain: "flagged before it lapses" },
      { label: "Key account retention", value: "91%", gain: "with proactive check-ins" },
    ],
    insights: [
      { icon: RefreshCw, title: "Reorder tracking is your real revenue lever", body: "A wholesale business with 38 active accounts and no reorder tracking is flying blind. Flagging accounts whose reorder window has passed — before they go elsewhere — is worth more than any new prospect campaign." },
      { icon: Users, title: "Territory management at scale", body: "As your account base grows, manually knowing which rep owns which region and account tier becomes impossible. Automated routing ensures every new inquiry lands with the right person in under an hour." },
      { icon: TrendingUp, title: "Trial orders predict lifetime value", body: "Distributors who follow up within 48 hours of a trial order fulfillment convert to ongoing accounts at 2.4× the rate of those who wait for the client to re-initiate. Automate this touchpoint." },
    ],
    automations: [
      "Enquiry from new region → assigned to correct territory rep instantly",
      "Quote sent → not opened in 3 days → rep prompted to call",
      "Trial order fulfilled → automatic 48-hour satisfaction follow-up",
      "Account reorder window reached → rep reminder before client lapses",
      "Order value increases 30% → flag as key account candidate",
      "Credit limit approached → finance team notified before order placed",
    ],
  },

  {
    id: "financial",
    label: "Financial Services",
    icon: "📈",
    tagline: "Onboard clients faster while keeping every step audit-ready",
    stages: [
      {
        name: "Enquiry",
        count: 12,
        leads: [
          { company: "Hartwell Family", contact: "Robert Hartwell", value: "$2.4M AUM", days: 1, heat: "hot", note: "Referral from existing client" },
          { company: "Chen Investments", contact: "Lucy Chen", value: "$850k AUM", days: 3, heat: "warm", note: "Reviewing three advisers" },
        ],
      },
      {
        name: "KYC / Needs Analysis",
        count: 7,
        leads: [
          { company: "Parkside Pension", contact: "David Moore", value: "$5.1M AUM", days: 4, heat: "warm", note: "Documents 80% received" },
          { company: "Stafford Trust", contact: "Karen Walsh", value: "$1.8M AUM", days: 7, heat: "warm", note: "AML check pending" },
        ],
      },
      {
        name: "Solution Proposed",
        count: 5,
        leads: [
          { company: "Mercer Holdings", contact: "Philip Grant", value: "$3.2M AUM", days: 2, heat: "hot", note: "Portfolio model approved by client" },
          { company: "Avon Trustees", contact: "Sandra King", value: "$920k AUM", days: 8, heat: "cold", note: "Board meeting delayed decision" },
        ],
      },
      {
        name: "Compliance & Onboarding",
        count: 3,
        leads: [
          { company: "Blackthorn Capital", contact: "George Niven", value: "$7.5M AUM", days: 3, heat: "hot", note: "Final compliance sign-off today" },
          { company: "Unity Wealth", contact: "Tina Rhodes", value: "$1.4M AUM", days: 5, heat: "warm", note: "Account setup in progress" },
        ],
      },
    ],
    metrics: [
      { label: "Avg. days to onboard", value: "18 days", gain: "−12 days vs. manual process" },
      { label: "KYC document completion", value: "94%", gain: "vs. 61% with email chasing" },
      { label: "Referral conversion rate", value: "67%", gain: "+31 pts vs. cold enquiries" },
    ],
    insights: [
      { icon: ShieldCheck, title: "Compliance is your competitive advantage", body: "Firms that make the compliance and onboarding process frictionless win mandates over advisers with better performance records. A client who submits documents through a clean checklist interface is already sold on your professionalism." },
      { icon: BarChart2, title: "Every touchpoint needs an audit trail", body: "Regulators want to see when you made contact, what was discussed, and what was agreed. A system that logs every interaction automatically protects your firm and removes the burden of manual record-keeping." },
      { icon: Users, title: "Referred clients convert at twice the rate", body: "Your existing clients are your best marketing channel. Systematically identifying clients approaching review meetings and asking for introductions at the right moment doubles referral flow without a single ad spend." },
    ],
    automations: [
      "Enquiry → fact-find questionnaire sent within 1 hour",
      "Prospect responds → KYC document checklist triggered with upload link",
      "Document gap detected → automated reminder every 3 days",
      "Proposal accepted → compliance workflow and account setup triggered",
      "Client onboarded → annual review date auto-scheduled",
      "Review date approaching → re-engagement and referral request sequence",
    ],
  },
];

// ─── Generic benefits ─────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: Zap,
    title: "Capture every lead",
    body: "Web forms, email, phone, referrals, trade shows — every channel feeds one place. Nothing falls into an inbox and dies.",
    points: ["Unified inbox for all inbound sources", "Duplicate detection and smart merging", "Auto-assign based on territory, service, or tier"],
  },
  {
    icon: GitMerge,
    title: "Automate the follow-up",
    body: "The most expensive thing in sales is forgetting to follow up. Sequences, reminders, and escalations run without anyone remembering to set them.",
    points: ["Time-based and behaviour-triggered sequences", "Escalation rules when leads go cold", "Team notifications so nothing needs manual chasing"],
  },
  {
    icon: BarChart2,
    title: "Report what leadership actually needs",
    body: "Pipeline value by stage, win rates by source, average deal duration, team performance — live, not in a spreadsheet updated every Friday.",
    points: ["Live pipeline and revenue forecasting", "Win/loss analysis by source and rep", "Conversion rates at every stage"],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

const HEAT = {
  hot:  { dot: "bg-emerald-500", bar: "border-l-emerald-500", label: "Hot" },
  warm: { dot: "bg-amber-400",   bar: "border-l-amber-400",   label: "Warm" },
  cold: { dot: "bg-slate-300",   bar: "border-l-slate-300",   label: "Cold" },
};

function LeadCard({ lead }) {
  const h = HEAT[lead.heat];
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${h.bar} p-3 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{lead.company}</div>
          <div className="text-xs text-slate-500 truncate">{lead.contact}</div>
        </div>
        <span className={`h-2 w-2 rounded-full flex-none mt-1 ${h.dot}`} />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-600">{lead.value}</span>
        <span className="text-xs text-slate-400">{lead.days === 0 ? "Today" : `${lead.days}d in stage`}</span>
      </div>
      {lead.note && (
        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{lead.note}</p>
      )}
    </div>
  );
}

function KanbanBoard({ industry }) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* fake toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 w-48">
          <Search className="h-3.5 w-3.5 flex-none" />
          <span>Search pipeline…</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
            <Bell className="h-3.5 w-3.5" />
          </button>
          <div className="flex -space-x-1.5">
            {["SL","AR","JK"].map((i) => (
              <div key={i} className="h-6 w-6 rounded-full bg-slate-700 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">{i}</div>
            ))}
          </div>
        </div>
      </div>

      {/* kanban */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 bg-slate-100">
        {industry.stages.map((stage, si) => (
          <div key={stage.name} className={`p-3 ${si < industry.stages.length - 1 ? "border-r border-slate-200" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 truncate">{stage.name}</span>
              <span className="text-xs font-mono font-semibold text-slate-400">{stage.count}</span>
            </div>
            <div className="space-y-2">
              {stage.leads.map((lead) => (
                <LeadCard key={lead.company} lead={lead} />
              ))}
              <div className="rounded-xl border border-dashed border-slate-300 h-14 flex items-center justify-center text-xs text-slate-400">
                + {stage.count - 2} more
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* stats bar */}
      <div className="flex items-center gap-6 bg-white border-t border-slate-200 px-4 py-2.5 overflow-x-auto">
        {industry.metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2 flex-none text-xs">
            <span className="text-slate-500">{m.label}</span>
            <span className="font-semibold text-slate-900">{m.value}</span>
            <span className="text-emerald-600">{m.gain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CRMSimulator() {
  const [active, setActive] = useState(0);
  const industry = INDUSTRIES[active];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">

        {/* Nav */}
        <div className="flex items-center justify-between mb-14">
          <a href="/"><WordMark dark /></a>
          <div className="flex items-center gap-3">
            <a href="/calculator" className="hidden sm:inline-flex text-xs font-medium text-slate-500 hover:text-slate-900">
              Free audit
            </a>
            <a href="/scope-lock" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
              Start your build <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Interactive demo — pick your industry
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            See your pipeline.<br className="hidden sm:block" />
            <span className="text-slate-400">Before you build it.</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-xl">
            Select your industry below to see how a custom CRM system would organise your leads, automate your follow-up, and surface the numbers that matter.
          </p>
        </div>

        {/* Industry picker */}
        <div className="flex flex-wrap gap-2 mb-8">
          {INDUSTRIES.map((ind, i) => (
            <button
              key={ind.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                active === i
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
              }`}
            >
              <span>{ind.icon}</span>
              <span>{ind.label}</span>
            </button>
          ))}
        </div>

        {/* Tagline */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">{industry.icon}</span>
          <p className="text-lg font-semibold tracking-tight text-slate-800">{industry.tagline}</p>
        </div>

        {/* Board simulation */}
        <KanbanBoard industry={industry} />

        {/* Insights + Automations */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Insights */}
          <div className="lg:col-span-2 space-y-4">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">
              Why it works for {industry.label}
            </div>
            {industry.insights.map((ins) => (
              <div key={ins.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-emerald-50">
                    <ins.icon className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-semibold tracking-tight text-slate-900">{ins.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{ins.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Automations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Built-in automations</span>
            </div>
            <ul className="space-y-3">
              {industry.automations.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                  <ChevronRight className="h-4 w-4 flex-none text-emerald-500 mt-0.5" strokeWidth={2.5} />
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Generic benefits */}
        <div className="mt-16">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Works for any business</div>
          <h2 className="text-2xl font-semibold tracking-tight mb-7">
            Three things every CRM system we build does, regardless of industry
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 mb-4">
                  <b.icon className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="font-semibold tracking-tight mb-2">{b.title}</div>
                <p className="text-sm leading-relaxed text-slate-600 mb-4">{b.body}</p>
                <ul className="space-y-1.5">
                  {b.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="h-3.5 w-3.5 flex-none text-emerald-500 mt-px" strokeWidth={3} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Platform note */}
        <div className="mt-12 rounded-2xl bg-slate-900 text-slate-100 p-8 sm:p-10">
          <div className="max-w-2xl">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Platform independent</div>
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              Built for your workflow, not the other way around
            </h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              The system you see simulated here can be built on the platform that fits your team best.
              We default to Monday.com for most clients — it's fast to build on, easy for teams to adopt,
              and powerful enough for complex automations. But the architecture, logic, and automations
              we design are transferable. You own the system. The platform is just where it lives.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                "No-code interface your team can edit themselves",
                "Connects to your existing tools via API",
                "Works on mobile, tablet, and desktop",
                "Dashboards your leadership can actually read",
                "Built and live in 30 days, not 6 months",
                "Full documentation — you fully own it on day one",
              ].map((p) => (
                <div key={p} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="h-4 w-4 flex-none text-emerald-400 mt-0.5" strokeWidth={2.5} />
                  {p}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/scope-lock" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
                Start your Scope Lock <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/calculator" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white">
                Get your free audit first
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <WordMark dark className="opacity-40 scale-75 origin-left" />
          <p className="text-xs text-slate-400">* CRM systems are built on Monday.com where applicable.</p>
        </div>
      </div>
    </div>
  );
}
