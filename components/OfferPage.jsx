"use client";
import React, { useState } from "react";
import {
  ArrowRight, Check, X, ShieldCheck, FileText, ChevronDown,
} from "lucide-react";

function WordMark({ dark = false, className = "" }) {
  const color = dark ? "text-slate-900" : "text-white";
  return (
    <div className={`flex items-baseline gap-0 font-black uppercase tracking-tighter leading-none select-none ${color} ${className}`}>
      <span className="text-2xl">Star</span>
      <span className="text-[9px] font-bold tracking-[0.2em] self-end mb-0.5 mx-0.5 opacity-70">the</span>
      <span className="text-2xl">tup</span>
    </div>
  );
}


const TIERS = {
  USD: {
    sym: "$",
    items: [
      { name: "Foundational", total: "9,000", monthly: "3,000", tag: "Limited — case-study partners" },
      { name: "Core", total: "18,000", monthly: "6,000", tag: "Most teams start here" },
      { name: "Premium", total: "30,000", monthly: "10,000", tag: "Complex / multi-system" },
    ],
  },
  ZAR: {
    sym: "R",
    items: [
      { name: "Foundational", total: "120,000", monthly: "40,000", tag: "Limited — case-study partners" },
      { name: "Core", total: "180,000", monthly: "60,000", tag: "Most teams start here" },
      { name: "Premium", total: "300,000", monthly: "100,000", tag: "Complex / multi-system" },
    ],
  },
};

const INCLUDED = [
  "One core workflow built end-to-end (capture → score → route → report)",
  "CRM board your team already knows how to use",
  "One reporting dashboard with the metrics leadership actually watches",
  "One third-party integration (your CRM, enrichment, or calendar)",
  "Team training, recorded and yours to keep",
  "Exhaustive handover documentation — you fully own it",
];

const DEFERRED = [
  "Multiple interlocking automations and edge-case branching",
  "Enterprise SSO / complex permission hierarchies",
  "Native mobile apps",
  "Custom BI / ad-hoc report builders",
  "Long chains of integrations",
];

const FAQS = [
  { q: "Do I have to get on a call?", a: "No. The audit is automated, the scope and price are transparent on this page, and you start with a short Scope Lock questionnaire and a deposit. If you'd rather talk it through, you can — but nothing here requires it." },
  { q: "What does \"shipped in 30 days\" actually mean?", a: "A working system, in your team's hands, doing the core job — not a demo. The clock starts only once the Scope Lock is signed and the first month is paid, so the date is real." },
  { q: "What if it's not done in 30 days?", a: "If we miss for a reason that's on us, you get an extra month of support at no charge. The guarantee is in the agreement." },
  { q: "Do we own what you build?", a: "Yes. On final payment, the system, the data, and the documentation are entirely yours. Our reusable internal tooling stays ours; your application is fully yours." },
];

export default function OfferPage() {
  const [currency, setCurrency] = useState("USD");
  const [openFaq, setOpenFaq] = useState(0);
  const tiers = TIERS[currency];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">

        {/* Brand */}
        <div className="flex items-center justify-between mb-12">
          <WordMark dark />
          <a href="#pricing" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
            See pricing <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Hero */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Custom apps & CRM lead systems
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Shipped in <span className="font-mono tabular-nums">30</span>.
            <br className="hidden sm:block" /> Supported for <span className="font-mono tabular-nums">60</span>.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            We turn your worst pipeline bottleneck into a working CRM system in one month —
            then spend two more making sure your team runs it. No endless discovery. No disappearing act.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href="/scope-lock" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Start your Scope Lock <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#how" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              See how it works <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> No call required to start.
          </p>
          <a href="/calculator" className="mt-3 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Or get your free automated audit first &rarr;
          </a>
        </div>

        {/* Process Flow */}
        <div id="how" className="mt-12 overflow-hidden rounded-2xl bg-slate-950 shadow-sm p-8 sm:p-10">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-8">How it works</div>
          <div className="relative">
            {/* connecting line */}
            <div className="hidden sm:block absolute top-5 left-0 right-0 h-px bg-slate-700" style={{ left: "10%", right: "10%" }} />
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative">
              {[
                { n: "01", label: "Free Audit", sub: "Run the calculator — instant Bottleneck Report, no call needed" },
                { n: "02", label: "Bottleneck Report", sub: "AI analysis pinpoints exactly where revenue leaks and what to build" },
                { n: "03", label: "Scope Lock", sub: "Short async questionnaire fixes scope, price, and ship date" },
                { n: "04", label: "30-Day Build", sub: "Your CRM system built and live — fixed date, no delays" },
                { n: "05", label: "60-Day Support", sub: "Training, optimisation, and documentation so it sticks" },
              ].map((step, i) => (
                <div key={step.n} className="flex flex-col items-center text-center">
                  <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-mono font-semibold mb-3 ${
                    i === 3
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : "border-slate-600 bg-slate-900 text-slate-400"
                  }`}>
                    {step.n}
                  </div>
                  <div className="text-sm font-semibold text-slate-100 tracking-tight">{step.label}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 max-w-[140px]">{step.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <WordMark className="opacity-50 scale-75 origin-left" />
              <span className="text-xs text-slate-500">Shipped in 30 · Supported for 60</span>
            </div>
            <a href="/calculator" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400">
              Start with the free audit <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>


        {/* Scope */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">What a 30-day build includes</h2>
          <p className="mt-2 text-slate-600 text-sm max-w-xl">
            We ship the spine first — the core system that proves the value and gets your team using it.
            Everything else becomes your roadmap, not scope creep.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 mb-3">
                <Check className="h-4 w-4" strokeWidth={3} />
                <span className="text-xs font-medium uppercase tracking-wider">In the MVP</span>
              </div>
              <ul className="space-y-2.5">
                {INCLUDED.map((i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-500" strokeWidth={2.5} />
                    <span className="leading-relaxed">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <FileText className="h-4 w-4" strokeWidth={2.5} />
                <span className="text-xs font-medium uppercase tracking-wider">Deferred to your roadmap</span>
              </div>
              <ul className="space-y-2.5">
                {DEFERRED.map((i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-500">
                    <X className="mt-0.5 h-4 w-4 flex-none text-slate-300" strokeWidth={2.5} />
                    <span className="leading-relaxed">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Pricing</div>
              <h2 className="text-2xl font-semibold tracking-tight">One fixed program. Billed monthly.</h2>
              <p className="mt-1.5 text-sm text-slate-600">A 3-month engagement: the 30-day build, then 60 days of support.</p>
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium self-start">
              {["USD", "ZAR"].map((cc) => (
                <button key={cc} onClick={() => setCurrency(cc)}
                  className={"px-3 py-1.5 rounded-md transition-colors " +
                    (currency === cc ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900")}>
                  {cc}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {tiers.items.map((t, i) => {
              const featured = i === 1;
              return (
                <div key={t.name}
                  className={"relative flex flex-col rounded-2xl border p-6 " +
                    (featured ? "border-slate-900 bg-slate-950 text-slate-100 shadow-lg" : "border-slate-200 bg-white")}>
                  {featured && (
                    <span className="absolute -top-2.5 left-6 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-slate-950">
                      Recommended
                    </span>
                  )}
                  <div className="text-sm font-semibold tracking-tight">{t.name}</div>
                  <div className={"text-xs mt-0.5 " + (featured ? "text-slate-400" : "text-slate-500")}>{t.tag}</div>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                      {tiers.sym}{t.monthly}
                    </span>
                    <span className={"text-sm " + (featured ? "text-slate-400" : "text-slate-500")}>/mo</span>
                  </div>
                  <div className={"mt-1 text-xs " + (featured ? "text-slate-400" : "text-slate-500")}>
                    {tiers.sym}{t.total} total · 3 months
                  </div>
                  <a href="/scope-lock"
                    className={"mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors " +
                      (featured ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                                : "bg-slate-900 text-white hover:bg-slate-800")}>
                    Start <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start (no-call) */}
        <div id="start" className="mt-16 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Start without a call</h2>
          <p className="mt-2 text-slate-700 max-w-2xl">
            Three steps, all async. You're in the build pipeline without booking a meeting.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["Answer the Scope Lock", "A short questionnaire pins down exactly what we'll build and the date we'll ship it."],
              ["Approve & pay month one", "We send the fixed scope and price. Approve it and pay the first month — that starts the 30-day clock."],
              ["Build begins", "Your project lands on a Monday board and we ship daily updates. First check-in is async too."],
            ].map(([t, b], i) => (
              <div key={t} className="rounded-xl border border-emerald-200 bg-white p-4">
                <span className="font-mono text-sm font-semibold text-emerald-600 tabular-nums">{`0${i + 1}`}</span>
                <div className="mt-1 font-semibold text-sm tracking-tight">{t}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{b}</p>
              </div>
            ))}
          </div>
          <a href="/scope-lock" className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Begin my Scope Lock <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-5">Questions</div>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {FAQS.map((f, i) => (
              <div key={f.q} className="p-5">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 text-left">
                  <span className="text-sm font-semibold tracking-tight">{f.q}</span>
                  <ChevronDown className={"h-4 w-4 flex-none text-slate-400 transition-transform " + (openFaq === i ? "rotate-180" : "")} />
                </button>
                {openFaq === i && <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          * Our CRM systems are built on and powered by <a href="https://monday.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Monday.com</a>.
        </p>

        <div className="mt-6 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <WordMark dark className="opacity-40 scale-75 origin-left" />
          <a href="/scope-lock" className="text-xs font-semibold text-slate-900 hover:text-emerald-600">Start your Scope Lock →</a>
        </div>
      </div>
    </div>
  );
}
