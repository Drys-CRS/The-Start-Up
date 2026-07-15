"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, X, ShieldCheck, FileText, ChevronDown, Monitor,
  Search, TrendingDown, ClipboardCheck, Hammer, LifeBuoy, Tag, Unlock, Zap, RefreshCw,
} from "lucide-react";
import WordMark from "./WordMark";
import PipelinePreview from "./PipelinePreview";
import { FAQS } from "@/lib/faqs";

// Fade-and-rise as each section scrolls into view — plays once, doesn't re-trigger on scroll-back.
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

// Per-item stagger for grids — pass i as the array index.
const staggerItem = (i) => ({
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
});

const OFFER_DEADLINE = "30 Sep 2026";

const TIERS = {
  sym: "$",
  offer: { total: "1,500", was: "3,000", tag: "30-day build · 60 days support FREE" },
  retainer: "150", // optional monthly retainer, starts only after the free support period ends
};

const TRUST_POINTS = [
  "Fixed price, no overruns",
  "30-day build, fixed date",
  "No call required to start",
  "50% off launch cohort",
];

const STEPS = [
  { n: "01", icon: Search, label: "Free Audit", sub: "Run the calculator — see exactly where your sales cycle is breaking down" },
  { n: "02", icon: TrendingDown, label: "Bottleneck Report", sub: "AI pinpoints where revenue leaks and what fixes it, no call needed" },
  { n: "03", icon: ClipboardCheck, label: "Your Build Plan", sub: "Same page, a few more questions — fixes scope, price, and ship date" },
  { n: "04", icon: Hammer, label: "30-Day Build", sub: "Your sales cycle rebuilt and live in your CRM — fixed date, no delays" },
  { n: "05", icon: LifeBuoy, label: "Support Period", sub: "60 days free — training, optimisation, documentation. Keep it running after with an optional monthly retainer." },
];

const INCLUDED = [
  { icon: Zap, title: "Core workflow, end-to-end", body: "Capture → score → route → report, built and tested — not a demo.", big: true },
  { icon: ClipboardCheck, title: "CRM board your team knows", body: "Configured on the platform that fits your workflow." },
  { icon: TrendingDown, title: "One reporting dashboard", body: "The metrics leadership actually watches, nothing else." },
  { icon: Check, title: "Integrations in scope", body: "Your CRM, enrichment tools, calendars — connected." },
  { icon: FileText, title: "Recorded team training", body: "Yours to keep and reuse as your team grows." },
  { icon: ShieldCheck, title: "Full handover documentation", body: "You fully own it — no dependency on us to run it." },
];

const DEFERRED = [
  "Multiple interlocking automations and edge-case branching",
  "Enterprise SSO / complex permission hierarchies",
  "Native mobile apps",
  "Custom BI / ad-hoc report builders",
  "Long chains of integrations",
];

const GUARANTEES = [
  { icon: ShieldCheck, title: "30-day guarantee", body: "Miss the date for a reason that's on us, get 30 extra days of support free." },
  { icon: Tag, title: "Fixed price, always", body: "The price you sign is the price you pay. No surprise invoices." },
  { icon: Unlock, title: "You own what we build", body: "System, data, documentation — fully yours on final payment." },
  { icon: Zap, title: "No call required", body: "Audit, scope, and price all happen async, on this page." },
];

export default function OfferPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const tiers = TIERS;

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Sticky nav */}
      <div className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between">
          <WordMark />
          <a href="#pricing" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-teal-500 px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-teal-400">
            See pricing <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> For businesses whose CRM isn't running the sales cycle
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Your CRM isn't broken.
              <br /> Your sales cycle is.
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Leads stall, reps skip steps, follow-up happens whenever someone remembers. We rebuild the process
              and automation around your CRM so it actually runs your sales cycle. Shipped in 30 days.
              Supported for <span className="font-mono tabular-nums">60–120</span>. No endless discovery. No disappearing act.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/calculator" className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
                Get your free audit <ArrowRight className="h-4 w-4" />
              </motion.a>
              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/calculator?step=buildplan" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200">
                Start Your Build Plan <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" /> No call required to start.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          >
            <PipelinePreview stage="broken" />
            <a href="/crm-demo" className="mt-4 group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-900 transition-colors">
                <Monitor className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400">See a live system example</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400">Pick your industry — see exactly what we'd build for you</div>
              </div>
              <ArrowRight className="h-4 w-4 flex-none text-slate-300 dark:text-slate-600 group-hover:text-teal-500 ml-auto" />
            </a>
          </motion.div>
        </div>

        {/* Trust strip */}
        <motion.div {...reveal} className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5">
          {TRUST_POINTS.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Check className="h-3.5 w-3.5 text-teal-500" strokeWidth={3} /> {t}
            </span>
          ))}
        </motion.div>

        {/* What's included — bento grid */}
        <motion.div {...reveal} className="mt-16">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">What's included</div>
          <h2 className="text-2xl font-semibold tracking-tight">A 30-day build ships the spine first.</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-xl">
            The core system that proves the value and gets your team using it. Everything else becomes
            your roadmap, not scope creep.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INCLUDED.map((item, i) => (
              <motion.div
                key={item.title}
                {...staggerItem(i)}
                className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 ${item.big ? "sm:col-span-2" : ""}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 mb-4">
                  <item.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" strokeWidth={2.5} />
                </div>
                <div className="font-semibold tracking-tight mb-1.5">{item.title}</div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.body}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <FileText className="h-3.5 w-3.5 flex-none" />
            <span>Deferred to your roadmap: {DEFERRED.join(" · ")}</span>
          </div>
        </motion.div>

        {/* Guarantees bento */}
        <motion.div {...reveal} className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GUARANTEES.map((g, i) => (
            <motion.div
              key={g.title}
              {...staggerItem(i)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5"
            >
              <g.icon className="h-5 w-5 text-teal-500 mb-3" strokeWidth={2.5} />
              <div className="font-semibold text-sm tracking-tight mb-1.5">{g.title}</div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{g.body}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Pipeline preview — organizing */}
        <motion.div {...reveal} className="mt-16">
          <div className="text-center max-w-lg mx-auto mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">From scattered to sorted.</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
              Every lead gets a stage, an owner, and a next step — automatically. No more guessing what happened to who.
            </p>
          </div>
          <div className="max-w-xl mx-auto">
            <PipelinePreview stage="organizing" />
          </div>
        </motion.div>

        {/* Process Flow */}
        <motion.div {...reveal} id="how" className="mt-16 overflow-hidden rounded-2xl bg-slate-950 shadow-sm p-8 sm:p-10">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-8">How it works</div>
          <div className="relative">
            {/* connecting line */}
            <div className="hidden sm:block absolute top-5 left-0 right-0 h-px bg-slate-700" style={{ left: "10%", right: "10%" }} />
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative">
              {STEPS.map((step, i) => (
                <motion.div key={step.n} {...staggerItem(i)} className="flex flex-col items-center text-center">
                  <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 mb-3 ${
                    i === 0
                      ? "border-teal-500 bg-teal-500 text-slate-950"
                      : "border-slate-600 bg-slate-900 text-slate-400"
                  }`}>
                    <step.icon className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <div className="text-sm font-semibold text-slate-100 tracking-tight">{step.label}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 max-w-[140px]">{step.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <WordMark context="dark-bg" className="opacity-50 scale-75 origin-left" />
              <span className="text-xs text-slate-500">Shipped in 30 · Supported for 60–120</span>
            </div>
            <a href="/calculator" className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-400">
              Start with the free audit <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div {...reveal} id="pricing" className="mt-16">
          <div className="mb-7">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Pricing</div>
            <h2 className="text-2xl font-semibold tracking-tight">One package. Fixed scope. 50% off.</h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">One flat build fee — 30-day build + 60 days FREE support. Keep it running after with an optional {tiers.sym}{tiers.retainer}/mo retainer, plus third-party tools &amp; subscriptions billed at cost. Both are opt-in at signing — nothing recurring during your build.</p>
          </div>

          {/* Limited Time Offer — full-width feature block */}
          <div className="relative rounded-2xl border-2 border-teal-500 bg-slate-950 text-slate-100 p-7 sm:p-9 shadow-xl mb-5 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(16,185,129,0.12) 0%, transparent 60%)" }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-full bg-teal-500 px-3 py-0.5 text-xs font-bold text-slate-950 tracking-wide uppercase">
                    50% Off — Special
                  </span>
                  <span className="text-xs text-slate-400">Ends {OFFER_DEADLINE}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl text-slate-500 line-through tabular-nums">
                    {tiers.sym}{tiers.offer.was}
                  </span>
                  <span className="font-mono text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums text-white">
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
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 max-w-md">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">After your free support — both opt-in</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-sm text-slate-300">
                        <RefreshCw className="h-3.5 w-3.5 text-teal-400" /> Monthly retainer
                      </span>
                      <span className="font-mono text-sm text-white whitespace-nowrap">{tiers.sym}{tiers.retainer}<span className="text-slate-500">/mo</span></span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-sm text-slate-300">
                        <Tag className="h-3.5 w-3.5 text-teal-400" /> Tools &amp; subscriptions
                      </span>
                      <span className="font-mono text-sm text-slate-400 whitespace-nowrap">at cost</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    Support, maintenance, and hosting/APIs to keep your system running. Nothing recurring is charged during your build — you opt in when you sign.
                  </p>
                </div>
                <p className="mt-3 text-xs text-slate-500 max-w-md">
                  50% off for a small cohort of case-study partners. Once the September window closes, price returns to full rate.
                </p>
              </div>
              <div className="flex-none w-full sm:w-auto">
                <a href="/calculator?step=buildplan"
                  className="flex sm:inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-base font-semibold text-slate-950 hover:bg-teal-400 shadow-lg whitespace-nowrap">
                  Claim this rate <ArrowRight className="h-5 w-5" />
                </a>
                <p className="mt-2 text-center text-xs text-slate-500">No call required</p>
              </div>
            </div>
          </div>

        </motion.div>

        {/* Start (no-call) */}
        <motion.div {...reveal} id="start" className="mt-16 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Start without a call</h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300 max-w-2xl">
            Run the free audit first — it takes 2 minutes and carries straight into your Build Plan on the same page.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["Run the free audit", "2-minute Lead Leakage Calculator — AI pinpoints where your sales cycle is breaking down."],
              ["Lock in your Build Plan", "Same page — a few more questions pin down exactly what we'll build and the date we'll ship it."],
              ["Build begins", "We send scope, price, and a start date. Approve it, pay the deposit, and we're off — daily updates, no meetings."],
            ].map(([t, b], i) => (
              <div key={t} className="rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 p-4">
                <span className="font-mono text-sm font-semibold text-teal-600 dark:text-teal-400 tabular-nums">{`0${i + 1}`}</span>
                <div className="mt-1 font-semibold text-sm tracking-tight">{t}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{b}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="/calculator" className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
              Get your free audit <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/calculator?step=buildplan" className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/60">
              Skip to Your Build Plan <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>

        {/* Pipeline preview — AI power-up */}
        <motion.div {...reveal} className="mt-16">
          <div className="text-center max-w-lg mx-auto mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Then AI takes over the busywork.</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
              Scoring, routing, and follow-up sequencing run themselves — so your team spends time closing, not chasing.
            </p>
          </div>
          <div className="max-w-xl mx-auto">
            <PipelinePreview stage="ai" />
          </div>
        </motion.div>

        {/* Final CTA band */}
        <motion.div {...reveal} className="mt-16 relative overflow-hidden rounded-2xl bg-slate-950 p-8 sm:p-12 text-center">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.15) 0%, transparent 65%)" }} />
          <div className="relative">
            <div className="max-w-xl mx-auto mb-8 text-left">
              <PipelinePreview stage="complete" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Ready to fix your sales cycle?</h2>
            <p className="mt-2 text-slate-400 max-w-lg mx-auto">
              Run the free audit, see your number, and turn it into a fixed Build Plan — all on one page. No call required.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/calculator" className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
                Get your free audit <ArrowRight className="h-4 w-4" />
              </motion.a>
              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/calculator?step=buildplan" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500">
                Start Your Build Plan <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* FAQ — last content section */}
        <motion.div {...reveal} className="mt-16">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-5">Questions</div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {FAQS.map((f, i) => (
              <div key={f.q} className="p-5">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 text-left">
                  <span className="text-sm font-semibold tracking-tight">{f.q}</span>
                  <ChevronDown className={"h-4 w-4 flex-none text-slate-400 dark:text-slate-500 transition-transform " + (openFaq === i ? "rotate-180" : "")} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <WordMark className="opacity-40 scale-75 origin-left" />
          <div className="flex items-center gap-4">
            <a href="/calculator" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">Free audit →</a>
            <a href="/calculator?step=buildplan" className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400">Start Your Build Plan →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
