"use client";
import React, { useState } from "react";
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";
import WordMark from "./WordMark";

const TIERS = ["Foundational", "Core", "Premium"];
const TIER_PRICE = {
  USD: { Foundational: "$3,000/mo", Core: "$6,000/mo", Premium: "$10,000/mo" },
  ZAR: { Foundational: "R40,000/mo", Core: "R60,000/mo", Premium: "R100,000/mo" },
};

export default function ScopeLockForm() {
  const [currency, setCurrency] = useState("USD");
  const [f, setF] = useState({
    company: "", contact: "", email: "", tier: "Core",
    goal: "", bottleneck: "", workflow: "", musthaves: "",
    integrations: "", startDate: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const valid = f.company && /.+@.+\..+/.test(f.email) && f.goal && f.bottleneck;

  async function submit() {
    if (!valid) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/scope-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, currency }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch (e) {
      setStatus("error");
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";
  const label = "block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5";

  if (status === "done") {
    return (
      <div className="min-h-screen w-full bg-slate-50 font-sans flex items-center justify-center px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 mb-5">
            <Check className="h-6 w-6 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Scope Lock received.</h1>
          <p className="mt-3 text-slate-600">
            We have everything to put together your fixed scope, timeline, and price. You will get it by
            email — no call needed. Approve it and the 30-day clock starts.
          </p>
          <a href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-emerald-600">
            Back to the start <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <a href="/" className="mb-10 inline-block">
          <WordMark dark />
        </a>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Start your Scope Lock</h1>
        <p className="mt-3 text-slate-600 max-w-xl">
          A few questions pin down exactly what we will build and the date we will ship it. No call —
          we turn this into a fixed scope and price, you approve it, the build begins.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <span className={label + " mb-0"}>Your engagement</span>
            <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
              {["USD", "ZAR"].map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={"px-3 py-1 rounded-md transition-colors " +
                    (currency === c ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900")}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Company</label>
              <input className={input} value={f.company} onChange={set("company")} placeholder="Acme Co." />
            </div>
            <div>
              <label className={label}>Your name</label>
              <input className={input} value={f.contact} onChange={set("contact")} placeholder="Jane Doe" />
            </div>
            <div>
              <label className={label}>Work email</label>
              <input className={input} value={f.email} onChange={set("email")} placeholder="jane@acme.com" />
            </div>
            <div>
              <label className={label}>Tier</label>
              <select className={input} value={f.tier} onChange={set("tier")}>
                {TIERS.map((t) => <option key={t} value={t}>{t} — {TIER_PRICE[currency][t]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>What outcome are you buying? *</label>
            <textarea className={input} rows={2} value={f.goal} onChange={set("goal")}
              placeholder="e.g. Stop losing inbound leads to slow follow-up; give leadership real pipeline visibility." />
          </div>
          <div>
            <label className={label}>Your single biggest bottleneck right now *</label>
            <textarea className={input} rows={2} value={f.bottleneck} onChange={set("bottleneck")}
              placeholder="e.g. Leads sit in a shared inbox; reps update a CRM nobody trusts." />
          </div>
          <div>
            <label className={label}>The one core workflow this must handle</label>
            <textarea className={input} rows={2} value={f.workflow} onChange={set("workflow")}
              placeholder="e.g. Lead arrives → scored → routed to an owner → appears on a rep's Monday board → reported weekly." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Must-have features</label>
              <textarea className={input} rows={2} value={f.musthaves} onChange={set("musthaves")}
                placeholder="The non-negotiables." />
            </div>
            <div>
              <label className={label}>Integrations needed</label>
              <input className={input} value={f.integrations} onChange={set("integrations")}
                placeholder="CRM, calendar, enrichment…" />
            </div>
          </div>
          <div>
            <label className={label}>Ideal start date</label>
            <input type="date" className={input + " sm:w-56"} value={f.startDate} onChange={set("startDate")} />
          </div>

          {status === "error" && (
            <p className="text-sm text-rose-600">Something went wrong saving that. Please try again.</p>
          )}

          <button onClick={submit} disabled={!valid || status === "sending"}
            className={"inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors " +
              (valid && status !== "sending" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-400 cursor-not-allowed")}>
            {status === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Submit Scope Lock <ArrowRight className="h-4 w-4" /></>}
          </button>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Goes straight to our pipeline. We reply with scope, price, and a start date.
          </p>
        </div>
      </div>
    </div>
  );
}
