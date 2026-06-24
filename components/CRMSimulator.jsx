"use client";
import React, { useState } from "react";
import {
  ArrowRight, Search, Filter, Zap, Users, Clock,
  TrendingUp, BarChart2, Check, Bell, ChevronRight,
  Layers, RefreshCw, ShieldCheck, GitMerge,
  LayoutGrid, List, Calendar, Activity,
  Code2, Monitor, Package,
} from "lucide-react";
import WordMark from "./WordMark";

// ─── Industry data ─────────────────────────────────────────────────────────────

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
      { label: "Trial-to-demo rate", value: "34%", gain: "+18 pts with auto-routing" },
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

  // ── NEW SECTORS ──────────────────────────────────────────────────────────────

  {
    id: "healthcare",
    label: "Healthcare",
    icon: "❤️",
    tagline: "Reduce admin, fill appointment gaps, and keep patients from falling through the cracks",
    stages: [
      {
        name: "Referral Received",
        count: 18,
        leads: [
          { company: "Dr. Patel Clinic", contact: "Ref: James Wu", value: "$320 /visit", days: 1, heat: "hot", note: "GP referral — urgent physio assessment" },
          { company: "Metro Hospital", contact: "Ref: Sarah Young", value: "$280 /visit", days: 3, heat: "warm", note: "Post-surgery rehabilitation programme" },
        ],
      },
      {
        name: "Assessment Booked",
        count: 12,
        leads: [
          { company: "Northside Surgery", contact: "Ref: Tom Abbas", value: "$450 package", days: 2, heat: "hot", note: "Initial assessment Tuesday 10am" },
          { company: "Self-referral", contact: "Lucy Hammond", value: "$390 package", days: 5, heat: "warm", note: "Waiting for insurance pre-authorisation" },
        ],
      },
      {
        name: "Treatment Plan Active",
        count: 9,
        leads: [
          { company: "Riverdale Corp", contact: "Occupational — 4 staff", value: "$1,200 /mo", days: 8, heat: "warm", note: "Corporate health plan — monthly review" },
          { company: "Self-pay", contact: "Mark Simons", value: "$195 /session", days: 3, heat: "hot", note: "6-session plan, 4 remaining" },
        ],
      },
      {
        name: "Ongoing Care",
        count: 24,
        leads: [
          { company: "Blue Shield Corp", contact: "Corporate — 12 staff", value: "$3,600 /mo", days: 0, heat: "hot", note: "Annual contract renewing next month" },
          { company: "Long-term patient", contact: "Helen Brant", value: "$195 /session", days: 21, heat: "cold", note: "Missed last 2 appointments — re-engage" },
        ],
      },
    ],
    metrics: [
      { label: "Appointment fill rate", value: "91%", gain: "+23 pts with automated rebooking" },
      { label: "Referral response time", value: "4 hrs", gain: "vs. 2.1 days manually" },
      { label: "Patient retention (12mo)", value: "78%", gain: "+19 pts with check-in sequences" },
    ],
    insights: [
      { icon: Clock, title: "No-shows cost more than acquisition", body: "The average appointment no-show costs a practice $200 in lost revenue and blocked capacity. Automated SMS and email reminders 48 hours and 2 hours before reduce no-shows by up to 40%." },
      { icon: RefreshCw, title: "Referral pipelines prevent capacity gaps", body: "A structured referral tracking system lets you see which referring GPs and specialists are sending work, follow up on open referrals, and maintain the relationships that fill your calendar predictably." },
      { icon: ShieldCheck, title: "Compliant records protect your practice", body: "Centralised, timestamped patient interaction records protect against disputes and ensure compliance with health data regulations — without the manual filing burden." },
    ],
    automations: [
      "Referral received → intake form sent to patient within 1 hour",
      "Appointment booked → confirmation + preparation notes sent",
      "48 hours before appointment → SMS and email reminder",
      "No-show → rebooking link sent automatically within 30 minutes",
      "Treatment plan milestone → progress note triggered for practitioner",
      "Corporate plan renewal date approaching → account manager alerted",
    ],
  },

  {
    id: "realestate",
    label: "Real Estate",
    icon: "🏠",
    tagline: "Give every buyer, seller, and tenant the response speed that closes the deal",
    stages: [
      {
        name: "New Enquiry",
        count: 34,
        leads: [
          { company: "Buyer — Johnson Family", contact: "Michael Johnson", value: "$680k budget", days: 1, heat: "hot", note: "Pre-approved, needs 4-bed in Northdale" },
          { company: "Landlord — investment", contact: "Priya Naidoo", value: "$2,200 /mo rental", days: 2, heat: "warm", note: "2 units to let — portfolio landlord" },
        ],
      },
      {
        name: "Viewing Arranged",
        count: 18,
        leads: [
          { company: "Buyer — Chen Family", contact: "David Chen", value: "$540k budget", days: 4, heat: "warm", note: "Saturday 10am — 3 properties shortlisted" },
          { company: "Corporate tenant", contact: "Apex Tech (HR)", value: "$3,800 /mo lease", days: 2, heat: "hot", note: "Office lease decision by end of month" },
        ],
      },
      {
        name: "Offer Stage",
        count: 8,
        leads: [
          { company: "Buyer — Williams", contact: "Sarah Williams", value: "$612k offer", days: 3, heat: "hot", note: "5% under asking — counter submitted" },
          { company: "Relocating tenant", contact: "Horizon Group", value: "$4,200 /mo", days: 7, heat: "warm", note: "Awaiting head-office sign-off" },
        ],
      },
      {
        name: "Sale / Lease Agreed",
        count: 5,
        leads: [
          { company: "Buyer — completed", contact: "The Nguyen Family", value: "$725k", days: 1, heat: "hot", note: "Exchange this Friday" },
          { company: "Tenant — signed", contact: "Pulse Fitness", value: "$5,400 /mo", days: 2, heat: "hot", note: "Lease signed — keys handover booked" },
        ],
      },
    ],
    metrics: [
      { label: "Enquiry response time", value: "9 mins", gain: "vs. 4.3 hrs industry avg." },
      { label: "Viewing-to-offer rate", value: "44%", gain: "+17 pts with prep sequences" },
      { label: "Avg. days to close", value: "31 days", gain: "−14 days vs. unmanaged pipeline" },
    ],
    insights: [
      { icon: Clock, title: "The first agent to respond usually wins the listing", body: "Research shows 78% of buyers and tenants choose the agent who responds first. Automated instant acknowledgements and immediate rep assignment mean you're always first, even outside office hours." },
      { icon: Users, title: "Buyer profiles save lost matches", body: "When a new property is listed, your system can automatically match it against every active buyer profile and alert the right people — before the property even hits the public portals." },
      { icon: TrendingUp, title: "Post-sale relationships generate repeat revenue", body: "Landlords, investors, and upgrading homeowners come back — if you stay top of mind. Automated annual market valuations and check-ins keep your brand present without manual effort." },
    ],
    automations: [
      "Enquiry received → auto-acknowledgement + agent assigned within 5 mins",
      "Viewing booked → confirmation, directions, and property details sent",
      "Offer submitted → seller notified instantly with full details",
      "Offer agreed → conveyancing checklist triggered for both parties",
      "Keys handed over → 30-day check-in and review request sent",
      "Landlord's lease anniversary → rental appraisal offer automated",
    ],
  },

  {
    id: "ecommerce",
    label: "E-commerce & Retail",
    icon: "🛒",
    tagline: "Turn first-time stockists into recurring wholesale accounts",
    stages: [
      {
        name: "New Brand Lead",
        count: 28,
        leads: [
          { company: "Sunrise Organics", contact: "Kate Walsh — Buyer", value: "$48k /yr", days: 1, heat: "hot", note: "Inbound from trade show — 3 SKUs" },
          { company: "Urban Outpost", contact: "Ben Zhao — CEO", value: "$22k /yr", days: 3, heat: "warm", note: "Looking to switch current supplier" },
        ],
      },
      {
        name: "Sample Sent",
        count: 14,
        leads: [
          { company: "Nature's Best Retail", contact: "Amanda Price", value: "$96k /yr", days: 5, heat: "warm", note: "Samples out — feedback call in 2 days" },
          { company: "Peak Performance", contact: "Ross Turner — Buyer", value: "$34k /yr", days: 9, heat: "cold", note: "No feedback — follow up this week" },
        ],
      },
      {
        name: "Trial Order",
        count: 7,
        leads: [
          { company: "FreshBox Retail", contact: "Lisa Ng", value: "$61k /yr", days: 4, heat: "warm", note: "Trial order fulfilled — reorder in 3 weeks" },
          { company: "Vitality Stores", contact: "Cam Davis", value: "$180k /yr", days: 2, heat: "hot", note: "Trial exceeded targets — contract talks started" },
        ],
      },
      {
        name: "Active Stockist",
        count: 42,
        leads: [
          { company: "Wellbeing Direct", contact: "National account", value: "$420k /yr", days: 0, heat: "hot", note: "Top account — quarterly review next week" },
          { company: "Corner Health (19 stores)", contact: "Head of Buying", value: "$78k /yr", days: 18, heat: "cold", note: "Reorder overdue — competitor risk" },
        ],
      },
    ],
    metrics: [
      { label: "Sample-to-order rate", value: "54%", gain: "+22 pts with 48-hr follow-up" },
      { label: "Avg. account LTV", value: "$112k", gain: "tracked and visible" },
      { label: "Stockist retention rate", value: "88%", gain: "+31 pts vs. unmanaged accounts" },
    ],
    insights: [
      { icon: RefreshCw, title: "Reorder timing is your biggest revenue lever", body: "Wholesale revenue is won or lost in the days around each reorder cycle. A system that flags accounts approaching their reorder window — before they go to a competitor — pays for itself in a single retained account." },
      { icon: BarChart2, title: "Buyer behaviour predicts churn before it happens", body: "When a stockist who previously reordered every 4 weeks goes 6 weeks silent, something has changed. Automated flags give your team time to intervene before the account is lost." },
      { icon: TrendingUp, title: "Trial orders are your most important data point", body: "How a stockist behaves with their first order tells you everything about their lifetime value. Tracking sell-through rate and reorder speed creates a scoring system that lets your team prioritise the right accounts." },
    ],
    automations: [
      "New lead enquiry → sample request pack sent within 2 hours",
      "Sample sent → 5-day follow-up call reminder triggered",
      "Trial order placed → thank-you + next order discount sent on delivery",
      "Reorder window passed → rep alerted before account goes quiet",
      "Account hits $50k in orders → flagged as key account for priority service",
      "No order in 60 days → win-back sequence triggered automatically",
    ],
  },

  {
    id: "construction",
    label: "Construction & Property",
    icon: "🏗️",
    tagline: "Win more tenders, track every site, and never miss a contract milestone",
    stages: [
      {
        name: "Tender Enquiry",
        count: 21,
        leads: [
          { company: "Meridian Developments", contact: "Mark Forsyth — COO", value: "$1.2M contract", days: 2, heat: "hot", note: "Mixed-use development — tender due Friday" },
          { company: "City Infrastructure", contact: "Procurement Dept", value: "$340k contract", days: 4, heat: "warm", note: "3 contractors shortlisted" },
        ],
      },
      {
        name: "Site Survey",
        count: 9,
        leads: [
          { company: "Harrington Group", contact: "Project Director", value: "$780k contract", days: 3, heat: "warm", note: "Site survey done — pricing in progress" },
          { company: "Nova Retail Parks", contact: "Development Manager", value: "$2.4M contract", days: 7, heat: "hot", note: "Preliminary design approved — quote next" },
        ],
      },
      {
        name: "Quote Submitted",
        count: 6,
        leads: [
          { company: "Peak Property Ltd", contact: "Steve Lau — MD", value: "$510k contract", days: 4, heat: "warm", note: "Quote submitted — decision in 2 weeks" },
          { company: "Riverside Consortium", contact: "Project Lead", value: "$1.8M contract", days: 10, heat: "cold", note: "Stalled — decision delayed by planning" },
        ],
      },
      {
        name: "Awarded",
        count: 4,
        leads: [
          { company: "Summit Build Ltd", contact: "Contract Manager", value: "$960k contract", days: 1, heat: "hot", note: "Contract signed — mobilisation next week" },
          { company: "Greenfield Holdings", contact: "J. Blackwood — Owner", value: "$3.1M contract", days: 3, heat: "hot", note: "Largest active contract — phase 1 underway" },
        ],
      },
    ],
    metrics: [
      { label: "Tender win rate", value: "38%", gain: "+16 pts with faster response" },
      { label: "Avg. quote turnaround", value: "4.1 days", gain: "−2.8 days with templates" },
      { label: "Variation order tracking", value: "100%", gain: "vs. 0% on spreadsheets" },
    ],
    insights: [
      { icon: Clock, title: "Tender deadlines wait for no one", body: "A missed tender submission is 100% loss. A system that tracks every open tender, deadline, and required document — with automated reminders — eliminates the risk of losing work to admin failure rather than competition." },
      { icon: Layers, title: "Site and project capacity limits what you can bid", body: "Before committing to a new project, you need visibility into what your teams are currently delivering. Linking your pipeline to active site capacity prevents over-bidding on work you can't resource." },
      { icon: BarChart2, title: "Variation orders destroy margins when untracked", body: "Construction projects almost always scope-change. A system that captures, prices, and tracks every variation order in real time protects your margin and makes billing disputes nearly impossible." },
    ],
    automations: [
      "Tender received → checklist assigned to estimator with deadline",
      "Site survey complete → quote template pre-filled and assigned",
      "Quote submitted → 7-day and 14-day follow-up reminders",
      "Contract awarded → project setup checklist triggered",
      "Variation order raised → approval workflow and margin impact flagged",
      "Project milestone reached → invoice trigger and client notification",
    ],
  },

  {
    id: "education",
    label: "Education & Training",
    icon: "🎓",
    tagline: "Convert more enquiries to enrolments and keep your intake calendar full",
    stages: [
      {
        name: "Enquiry",
        count: 46,
        leads: [
          { company: "Deloitte SA", contact: "L&D Manager — Thabo N.", value: "$28k cohort", days: 1, heat: "hot", note: "60 staff — leadership development programme" },
          { company: "Private enquiry", contact: "Mrs Daniels (parent)", value: "$12k /yr", days: 3, heat: "warm", note: "Year 10 entry — requested prospectus" },
        ],
      },
      {
        name: "Open Day / Consult",
        count: 22,
        leads: [
          { company: "KPMG Africa", contact: "HR Director", value: "$54k contract", days: 2, heat: "hot", note: "Attended open session — follow-up call Thurs" },
          { company: "Private — family", contact: "The Peterson Family", value: "$12k /yr", days: 5, heat: "warm", note: "Visited campus — comparing 2 institutions" },
        ],
      },
      {
        name: "Application Submitted",
        count: 14,
        leads: [
          { company: "Standard Bank", contact: "People Lead — K. Adams", value: "$72k contract", days: 3, heat: "hot", note: "Application in — assessment pending" },
          { company: "Student — bursary", contact: "Amara Osei", value: "$18k /yr", days: 6, heat: "warm", note: "Academic assessment complete" },
        ],
      },
      {
        name: "Enrolled",
        count: 9,
        leads: [
          { company: "MTN Group", contact: "L&D — 24 staff enrolled", value: "$96k /yr", days: 0, heat: "hot", note: "Enterprise deal — cohort 2 already requested" },
          { company: "Full-fee student", contact: "Jordan Baptiste", value: "$12k /yr", days: 2, heat: "warm", note: "Enrolled — orientation in 3 weeks" },
        ],
      },
    ],
    metrics: [
      { label: "Enquiry-to-enrolment", value: "19%", gain: "+11 pts with automated nurture" },
      { label: "Corporate deal avg. value", value: "$48k", gain: "visible and trackable for the first time" },
      { label: "Open day show-up rate", value: "74%", gain: "+28 pts with reminder sequences" },
    ],
    insights: [
      { icon: Clock, title: "Speed of response determines enrolment", body: "Prospective students who receive a personalised response within 1 hour of enquiring are 6× more likely to enrol than those who wait 24 hours. Automated acknowledgements and assigned counsellors fix this instantly." },
      { icon: TrendingUp, title: "Corporate training is your highest-margin channel", body: "A single corporate training contract can be worth 20× an individual enrolment. A dedicated B2B pipeline — separate from your student pipeline — ensures these opportunities get the attention and responsiveness they require." },
      { icon: BarChart2, title: "Intake season demand is predictable — and plannable", body: "Enrolment enquiries follow clear seasonal patterns. A system with historical pipeline data lets you forecast intake numbers weeks in advance and resource your admissions team before the peak hits." },
    ],
    automations: [
      "Enquiry received → personalised info pack sent within 15 minutes",
      "Open day RSVP → confirmation + calendar invite + reminder sequence",
      "Application submitted → acknowledgement + next steps sent instantly",
      "Application approved → offer letter triggered with acceptance deadline",
      "Offer accepted → onboarding checklist and orientation invite sent",
      "Corporate inquiry → account manager assigned and scoping call booked",
    ],
  },

  // ── CUSTOM APP SECTOR ────────────────────────────────────────────────────────
  {
    id: "custom",
    label: "Custom App",
    icon: "⚙️",
    tagline: "Beyond CRM — purpose-built tools for any workflow you can describe",
    isCustomApp: true,
    metrics: [
      { label: "Avg. build time", value: "30 days", gain: "vs. 6–18 months traditional dev" },
      { label: "Apps in production", value: "15+", gain: "across 8 industries" },
      { label: "Team adoption rate", value: "94%", gain: "vs. ~30% for off-the-shelf tools" },
    ],
    insights: [
      { icon: Code2, title: "Off-the-shelf tools are a compromise, not a solution", body: "Software built for everyone is optimised for no one. A custom app built around your exact workflow eliminates the workarounds, unused features, and frustration of bending your process to fit a product someone else designed." },
      { icon: Zap, title: "30 days to live — not 6 months", body: "Traditional software development cycles kill momentum. We scope tightly, build to the exact requirements, and ship a working system in 30 days. You see real output in the first week, not after a quarterly review." },
      { icon: ShieldCheck, title: "You own it completely — no licensing lock-in", body: "There are no ongoing licensing fees for the app itself. You own the code, configuration, and documentation. If you want to extend it, move platforms, or hand it to an internal team, nothing stops you." },
    ],
    automations: [
      "New requirement → scoped and estimated within 24 hours",
      "Build kickoff → weekly progress update sent to stakeholder",
      "Feature complete → review session automatically booked",
      "Go-live → training session and full documentation delivered",
      "Post-launch → 60-day check-in and optimisation review",
      "Support request → triaged and resolved within 1 business day",
    ],
  },
];

// ─── Custom app types ──────────────────────────────────────────────────────────

const CUSTOM_APPS = [
  {
    icon: Monitor,
    name: "Client Portal",
    desc: "Give clients real-time visibility into project status, approvals, invoices, and communication — all branded to your business.",
    examples: [
      "Live project progress & milestone board",
      "Document review and approval workflows",
      "Invoice and payment tracking",
      "Secure messaging channel",
    ],
  },
  {
    icon: Calendar,
    name: "Booking & Scheduling System",
    desc: "Replace back-and-forth emails with automated booking flows, smart reminders, and real-time capacity management.",
    examples: [
      "Online booking interface",
      "Staff availability and capacity management",
      "Automated confirmations and reminders",
      "Cancellation and rescheduling flows",
    ],
  },
  {
    icon: Users,
    name: "Employee Onboarding Hub",
    desc: "Standardise how new hires get up to speed — tasks, documents, introductions, and sign-offs all tracked in one place.",
    examples: [
      "Day-1 to Week-4 task checklists",
      "Document signing and compliance tracking",
      "Manager approval workflows",
      "Training completion and certification records",
    ],
  },
  {
    icon: BarChart2,
    name: "Executive Reporting Dashboard",
    desc: "Give leadership the numbers they actually need — live, not updated every Friday in a spreadsheet one version behind.",
    examples: [
      "Live KPI and revenue board",
      "Team performance and output metrics",
      "Pipeline and forecast views",
      "Custom charts with filter controls",
    ],
  },
  {
    icon: Package,
    name: "Inventory & Stock Management",
    desc: "Track stock levels, flag low inventory before it becomes a problem, and trigger reorder workflows automatically.",
    examples: [
      "Real-time stock level board",
      "Low-stock alert automations",
      "Supplier reorder request workflows",
      "Purchase order tracking and history",
    ],
  },
  {
    icon: Code2,
    name: "Fully Custom Internal Tool",
    desc: "If none of the above fits, we scope a tool to your exact workflow — built in 30 days, documented, and fully yours.",
    examples: [
      "Any workflow digitised and automated",
      "Connects to your existing stack via API",
      "Reporting built around your specific KPIs",
      "Full documentation — yours to own and extend",
    ],
  },
];

// ─── Service overview cards ────────────────────────────────────────────────────

const SERVICE_CARDS = [
  {
    icon: GitMerge,
    accent: "bg-blue-50 text-blue-600",
    title: "CRM & Lead Pipeline",
    desc: "One structured system that captures every lead from every source, routes them to the right person, and tracks every deal from first touch to close.",
    points: [
      "Single pipeline across all inbound channels",
      "Auto-routing by territory or service type",
      "Follow-up automation so nothing goes cold",
      "Win/loss reporting by source and rep",
    ],
  },
  {
    icon: Zap,
    accent: "bg-emerald-50 text-emerald-600",
    title: "Workflow Automation",
    desc: "Replace the manual tasks your team repeats every day with automated flows that trigger on the right event at the right time — without anyone managing them.",
    points: [
      "Trigger-based sequences and task creation",
      "Cross-system integrations via API",
      "Escalation rules for time-sensitive items",
      "Instant notifications to the right person",
    ],
  },
  {
    icon: Code2,
    accent: "bg-violet-50 text-violet-600",
    title: "Custom App Development",
    desc: "When off-the-shelf tools don't fit your workflow, we build purpose-built apps — portals, booking systems, dashboards, and more — in 30 days.",
    points: [
      "Scoped precisely to your requirements",
      "Built and live in 30 days",
      "Full documentation — you own it entirely",
      "Connects to your existing tools via API",
    ],
  },
];

// ─── Generic benefits ──────────────────────────────────────────────────────────

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

// ─── Lookups ───────────────────────────────────────────────────────────────────

const HEAT = {
  hot:  { dot: "bg-emerald-500", bar: "border-l-emerald-500", label: "Hot",  hex: "#10b981" },
  warm: { dot: "bg-amber-400",   bar: "border-l-amber-400",   label: "Warm", hex: "#fbbf24" },
  cold: { dot: "bg-slate-300",   bar: "border-l-slate-300",   label: "Cold", hex: "#cbd5e1" },
};

const VIEWS = [
  { id: "pipeline",  label: "Pipeline",  icon: LayoutGrid },
  { id: "timeline",  label: "Timeline",  icon: Calendar },
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "table",     label: "Table",     icon: List },
];

// ─── Lead card ─────────────────────────────────────────────────────────────────

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

// ─── Kanban (pipeline) view ────────────────────────────────────────────────────

function KanbanBoard({ industry }) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
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

// ─── Timeline view ─────────────────────────────────────────────────────────────

function TimelineView({ industry }) {
  const MAX_DAYS = 21;
  const weeks = ["3 wks ago", "2 wks ago", "Last week", "This week"];
  const allLeads = industry.stages.flatMap((s) =>
    s.leads.map((l) => ({ ...l, stageName: s.name }))
  ).sort((a, b) => b.days - a.days);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 py-3">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Deal Timeline — days in current stage</span>
        <div className="flex items-center gap-3">
          {Object.entries(HEAT).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${v.dot}`} /> {v.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50">
        {weeks.map((w) => (
          <div key={w} className="px-3 py-2 text-xs font-medium text-slate-400 text-center border-r last:border-r-0 border-slate-200">{w}</div>
        ))}
      </div>

      <div className="bg-white divide-y divide-slate-100">
        {allLeads.map((lead) => {
          const pct = Math.min(100, Math.max(6, (lead.days / MAX_DAYS) * 100));
          return (
            <div key={lead.company + lead.contact} className="flex items-center gap-3 px-4 py-3">
              <div className="w-36 flex-none">
                <div className="text-sm font-semibold text-slate-900 truncate">{lead.company}</div>
                <div className="text-xs text-slate-400 truncate">{lead.stageName}</div>
              </div>
              <div className="flex-1 relative h-7 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="absolute right-0 top-0 bottom-0 rounded-lg"
                  style={{ width: `${pct}%`, backgroundColor: HEAT[lead.heat].hex, opacity: 0.75 }}
                />
                <div className="absolute inset-0 flex items-center pl-3">
                  <span className="text-xs font-semibold text-slate-700">
                    {lead.days === 0 ? "Today" : `${lead.days}d`}
                  </span>
                </div>
              </div>
              <div className="w-24 flex-none text-right">
                <div className="text-sm font-semibold text-emerald-600">{lead.value}</div>
              </div>
            </div>
          );
        })}
      </div>

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

// ─── Dashboard view ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
      <div className={`text-2xl font-bold tracking-tight ${accent ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
      <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
      <div className={`text-xs mt-1 ${accent ? "text-emerald-600" : "text-slate-400"}`}>{sub}</div>
    </div>
  );
}

function DashboardView({ industry }) {
  const allLeads = industry.stages.flatMap((s) =>
    s.leads.map((l) => ({ ...l, stageName: s.name }))
  );
  const totalCount = industry.stages.reduce((s, st) => s + st.count, 0);
  const hotLeads = allLeads.filter((l) => l.heat === "hot");
  const maxCount = Math.max(...industry.stages.map((s) => s.count));
  const funnelColors = ["#0f172a", "#334155", "#64748b", "#94a3b8"];

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total in Pipeline" value={totalCount} sub="active leads" />
        <KpiCard label="Hot Leads" value={hotLeads.length} sub={`${Math.round((hotLeads.length / allLeads.length) * 100)}% of pipeline`} accent />
        <KpiCard label={industry.metrics[0].label} value={industry.metrics[0].value} sub={industry.metrics[0].gain} />
        <KpiCard label={industry.metrics[1].label} value={industry.metrics[1].value} sub={industry.metrics[1].gain} />
      </div>

      {/* Funnel + top prospects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">Pipeline Funnel</div>
          <div className="space-y-3">
            {industry.stages.map((stage, i) => {
              const pct = Math.max(12, Math.round((stage.count / maxCount) * 100));
              return (
                <div key={stage.name} className="flex items-center gap-3">
                  <div className="w-32 flex-none text-xs text-slate-600 text-right truncate">{stage.name}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-7 overflow-hidden">
                    <div
                      className="h-7 rounded-full flex items-center px-3"
                      style={{ width: `${pct}%`, backgroundColor: funnelColors[i] }}
                    >
                      <span className="text-xs font-bold text-white">{stage.count}</span>
                    </div>
                  </div>
                  <div className="w-8 flex-none text-xs text-slate-400 text-right">
                    {Math.round((stage.count / totalCount) * 100)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">Hottest Prospects</div>
          <div className="space-y-3">
            {hotLeads.slice(0, 4).map((lead) => (
              <div key={lead.company + lead.contact} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-600">
                  {lead.company.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{lead.company}</div>
                  <div className="text-xs text-slate-400 truncate">{lead.stageName}</div>
                </div>
                <div className="text-sm font-semibold text-emerald-600 flex-none">{lead.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Latest Automation Activity</div>
            <div className="space-y-2">
              {industry.automations.slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 flex-none" />
                  <span className="text-xs text-slate-500 leading-relaxed">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-2xl px-5 py-3 overflow-x-auto">
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

// ─── Table view ────────────────────────────────────────────────────────────────

function TableView({ industry }) {
  const allLeads = industry.stages.flatMap((s) =>
    s.leads.map((l) => ({ ...l, stageName: s.name }))
  );

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 w-48">
          <Search className="h-3.5 w-3.5 flex-none" />
          <span>Search table…</span>
        </div>
        <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
          <Filter className="h-3.5 w-3.5" /> Filter
        </button>
      </div>

      <div className="overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Days</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Heat</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allLeads.map((lead) => {
              const h = HEAT[lead.heat];
              return (
                <tr key={lead.company + lead.contact} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 max-w-[140px] truncate">{lead.company}</td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{lead.contact}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap">{lead.stageName}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 whitespace-nowrap">{lead.value}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{lead.days === 0 ? "Today" : `${lead.days}d`}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
                      lead.heat === "hot" ? "text-emerald-600" : lead.heat === "warm" ? "text-amber-600" : "text-slate-400"
                    }`}>
                      <span className={`h-2 w-2 rounded-full flex-none ${h.dot}`} />
                      {h.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell max-w-xs truncate">{lead.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

// ─── Custom app grid ───────────────────────────────────────────────────────────

function CustomAppGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CUSTOM_APPS.map((app) => (
        <div
          key={app.name}
          className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 hover:shadow-sm transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 mb-4">
            <app.icon className="h-5 w-5 text-emerald-400" strokeWidth={2} />
          </div>
          <div className="font-semibold tracking-tight text-slate-900 mb-2">{app.name}</div>
          <p className="text-sm leading-relaxed text-slate-600 mb-4">{app.desc}</p>
          <ul className="space-y-1.5">
            {app.examples.map((ex) => (
              <li key={ex} className="flex items-start gap-2 text-xs text-slate-600">
                <Check className="h-3.5 w-3.5 flex-none text-emerald-500 mt-px" strokeWidth={3} />
                {ex}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CRMSimulator() {
  const [active, setActive] = useState(0);
  const [view, setView] = useState("pipeline");
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
            Select your industry to see how a custom system would organise your leads, automate your follow-up, and surface the numbers that matter.
          </p>
        </div>

        {/* Service overview */}
        <div className="mb-14">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">What we build</div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Three types of systems. One team. 30 days to live.</h2>
          <p className="text-slate-600 mb-7 max-w-2xl">
            Every system is custom-scoped to your business, built in 30 days, and handed over with full documentation.
            No vendor lock-in, no subscriptions for the system itself — you own it on day one.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SERVICE_CARDS.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent} mb-4`}>
                  <card.icon className="h-4.5 w-4.5" strokeWidth={2.5} />
                </div>
                <div className="font-semibold tracking-tight mb-2">{card.title}</div>
                <p className="text-sm leading-relaxed text-slate-600 mb-4">{card.desc}</p>
                <ul className="space-y-1.5">
                  {card.points.map((p) => (
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

        {/* Industry picker */}
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Explore by sector</div>
        <div className="flex flex-wrap gap-2 mb-6">
          {INDUSTRIES.map((ind, i) => (
            <button
              key={ind.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
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
        <div className="flex items-start gap-2.5 mb-3">
          <span className="text-2xl flex-none mt-0.5">{industry.icon}</span>
          <p className="text-lg font-semibold tracking-tight text-slate-800">{industry.tagline}</p>
        </div>

        {/* View toggle — hidden for Custom App sector */}
        {!industry.isCustomApp && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs text-slate-400">View as:</span>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    view === v.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <v.icon className="h-3.5 w-3.5" />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Simulation area */}
        {industry.isCustomApp ? (
          <CustomAppGrid />
        ) : view === "pipeline" ? (
          <KanbanBoard industry={industry} />
        ) : view === "timeline" ? (
          <TimelineView industry={industry} />
        ) : view === "dashboard" ? (
          <DashboardView industry={industry} />
        ) : (
          <TableView industry={industry} />
        )}

        {/* Insights + Automations */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">
              {industry.isCustomApp ? "Why custom apps work" : `Why it works for ${industry.label}`}
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {industry.isCustomApp ? "Delivery workflow" : "Built-in automations"}
              </span>
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
            Three things every system we build does, regardless of industry
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
              Every system you see simulated here can be built on the platform that fits your team best.
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
