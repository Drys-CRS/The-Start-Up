"use client";
import React, { useState } from "react";
import {
  ArrowRight, Check, X, ShieldCheck, FileText, ChevronDown,
} from "lucide-react";
import WordMark from "./WordMark";
import { FAQS } from "@/lib/faqs";


const OFFER_DEADLINE = "30 Sep 2026";

const TIERS = {
  USD: {
    sym: "$",
    offer: { total: "3,000", tag: "30-day build · 60 days support FREE" },
    items: [
      { name: "Premium", total: "5,000", tag: "Complex / multi-system builds" },
    ],
  },
  ZAR: {
    sym: "R",
    offer: { total: "60,000", tag: "30-day build · 60 days support FREE" },
    items: [
      { name: "Premium", total: "100,000", tag: "Complex / multi-system builds" },
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
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Systems &amp; AI for any business, any sector
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Shipped in <span className="font-mono tabular-nums">30</span>.
            <br className="hidden sm:block" /> Supported for <span className="font-mono tabular-nums">60–120</span>.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            We help businesses of every kind grow — through custom systems, smart processes, and AI that works for your team.
            Built in 30 days. Supported for 60 to 120. No endless discovery. No disappearing act.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href="/calculator" className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
              Get your free audit <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/scope-lock" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Start your Scope Lock <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" /> No call required to start.
            </p>
            <a href="/crm-demo" className="text-xs font-medium text-slate-400 hover:text-slate-600">
              See an example &rarr;
            </a>
          </div>
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
                { n: "05", label: "Support Period", sub: "60 days (Promotional) or 120 days (Premium) — training, optimisation, documentation" },
              ].map((step, i) => (
                <div key={step.n} className="flex flex-col items-center text-center">
                  <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-mono font-semibold mb-3 ${
                    i === 0
                      ? "border-teal-500 bg-teal-500 text-slate-950"
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
              <span className="text-xs text-slate-500">Shipped in 30 · Supported for 60–120</span>
            </div>
            <a href="/calculator" className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-400">
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
              <div className="flex items-center gap-2 text-teal-600 mb-3">
                <Check className="h-4 w-4" strokeWidth={3} />
                <span className="text-xs font-medium uppercase tracking-wider">In the MVP</span>
              </div>
              <ul className="space-y-2.5">
                {INCLUDED.map((i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-teal-500" strokeWidth={2.5} />
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
              <h2 className="text-2xl font-semibold tracking-tight">Two tiers. Fixed scope. Fixed price.</h2>
              <p className="mt-1.5 text-sm text-slate-600">Promotional: 30-day build + 60 days FREE support. Premium: 30-day build + 60 days support + 30 days FREE = 120 days total.</p>
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

          {/* Limited Time Offer — full-width feature block */}
          <div className="relative rounded-2xl border-2 border-teal-500 bg-slate-950 text-slate-100 p-7 sm:p-9 shadow-xl mb-5 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(16,185,129,0.12) 0%, transparent 60%)" }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-full bg-teal-500 px-3 py-0.5 text-xs font-bold text-slate-950 tracking-wide uppercase">
                    Limited Time Offer
                  </span>
                  <span className="text-xs text-slate-400">Ends {OFFER_DEADLINE}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-5xl font-semibold tracking-tight tabular-nums text-white">
                    {tiers.sym}{tiers.offer.total}
                  </span>
                  <span className="text-slate-400 text-sm">flat · all-in</span>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-teal-400" strokeWidth={3} /> 30-day build, fixed date
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-teal-400" strokeWidth={3} /> 60 days support — <span className="text-teal-400 font-semibold">FREE</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-teal-400" strokeWidth={3} /> Full handover docs
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500 max-w-md">
                  We're taking on a small cohort of case-study partners at this price. Once the September window closes, the rate moves to the standard tier.
                </p>
              </div>
              <div className="flex-none">
                <a href="/scope-lock"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-base font-semibold text-slate-950 hover:bg-teal-400 shadow-lg whitespace-nowrap">
                  Claim this rate <ArrowRight className="h-5 w-5" />
                </a>
                <p className="mt-2 text-center text-xs text-slate-500">No call required</p>
              </div>
            </div>
          </div>

          {/* Standard tier — Premium */}
          {tiers.items.map((t) => (
            <div key={t.name}
              className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-2xl border border-slate-900 bg-slate-950 text-slate-100 shadow-lg p-6 sm:p-8">
              <span className="absolute -top-2.5 left-6 rounded-full bg-teal-500 px-2.5 py-0.5 text-xs font-semibold text-slate-950">
                Standard
              </span>
              <div className="flex-1">
                <div className="text-base font-semibold tracking-tight">{t.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t.tag}</div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-teal-400" strokeWidth={3} /> 30-day build, fixed date
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-teal-400" strokeWidth={3} /> 60 days support included
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-teal-400" strokeWidth={3} /> +30 days FREE — <span className="text-teal-400 font-semibold">120 days total</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-teal-400" strokeWidth={3} /> Full handover documentation
                  </span>
                </div>
              </div>
              <div className="flex-none flex flex-col sm:items-end gap-3">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                      {tiers.sym}{t.total}
                    </span>
                    <span className="text-sm text-slate-400">flat · all-in</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">90 days included · +30 days FREE</div>
                </div>
                <a href="/scope-lock"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400 transition-colors whitespace-nowrap">
                  Start <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Start (no-call) */}
        <div id="start" className="mt-16 rounded-2xl border border-teal-200 bg-teal-50 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Start without a call</h2>
          <p className="mt-2 text-slate-700 max-w-2xl">
            Run the free audit first — it takes 2 minutes and pre-fills your Scope Lock. Everything else is async.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["Run the free audit", "2-minute Lead Leakage Calculator — AI pinpoints your biggest bottleneck and pre-fills your Scope Lock."],
              ["Answer the Scope Lock", "A short questionnaire pins down exactly what we'll build and the date we'll ship it."],
              ["Build begins", "We send scope, price, and a start date. Approve it, pay the deposit, and we're off — daily updates, no meetings."],
            ].map(([t, b], i) => (
              <div key={t} className="rounded-xl border border-teal-200 bg-white p-4">
                <span className="font-mono text-sm font-semibold text-teal-600 tabular-nums">{`0${i + 1}`}</span>
                <div className="mt-1 font-semibold text-sm tracking-tight">{t}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{b}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="/calculator" className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
              Get your free audit <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/scope-lock" className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50">
              Skip to Scope Lock <ArrowRight className="h-4 w-4" />
            </a>
          </div>
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
          <div className="flex items-center gap-4">
            <a href="/calculator" className="text-xs font-semibold text-teal-600 hover:text-teal-700">Free audit →</a>
            <a href="/scope-lock" className="text-xs font-semibold text-slate-900 hover:text-teal-600">Start your Scope Lock →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
