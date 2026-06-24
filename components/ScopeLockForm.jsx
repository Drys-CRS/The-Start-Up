"use client";
import React, { useState } from "react";
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";
import WordMark from "./WordMark";

const OFFER_DEADLINE = "30 Sep 2026";

const TIERS = [
  {
    value: "PROMOTIONAL (Base + Free 2 Months)",
    label: "Promotional",
    sublabel: "Base + Free 2 Months",
    price: { USD: "$3,000 flat", ZAR: "R60,000 flat" },
    note: { USD: "30-day build · 60 days support FREE", ZAR: "30-day build · 60 days support FREE" },
    promo: true,
  },
  {
    value: "Premium",
    label: "Premium",
    sublabel: "120-day support",
    price: { USD: "$10,000 /mo", ZAR: "R100,000 /mo" },
    note: { USD: "$50,000 total · 5 months", ZAR: "R500,000 total · 5 months" },
    promo: false,
  },
];

export default function ScopeLockForm() {
  const [currency, setCurrency] = useState("USD");
  const [f, setF] = useState({
    company: "", contact: "", email: "", tier: "PROMOTIONAL (Base + Free 2 Months)",
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
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";
  const label = "block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5";

  if (status === "done") {
    return (
      <div className="min-h-screen w-full bg-slate-50 font-sans flex items-center justify-center px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 mb-5">
            <Check className="h-6 w-6 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Scope Lock received.</h1>
          <p className="mt-3 text-slate-600">
            We have everything to put together your fixed scope, timeline, and price. You will get it by
            email — no call needed. Approve it and the 30-day clock starts.
          </p>
          <a href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-teal-600">
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
          </div>

          {/* Tier picker */}
          <div>
            <span className={label}>Select your tier</span>
            <div className="space-y-2.5">
              {TIERS.map((t) => {
                const selected = f.tier === t.value;
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setF({ ...f, tier: t.value })}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3.5 transition-all ${
                      selected
                        ? t.promo
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                          selected
                            ? t.promo ? "border-teal-500 bg-teal-500" : "border-slate-900 bg-slate-900"
                            : "border-slate-300"
                        }`}>
                          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${selected && t.promo ? "text-teal-700" : "text-slate-900"}`}>
                              {t.label}
                            </span>
                            {t.sublabel && (
                              <span className="text-xs font-medium text-slate-500">{t.sublabel}</span>
                            )}
                            {t.promo && (
                              <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                                Ends {OFFER_DEADLINE}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{t.note[currency]}</p>
                        </div>
                      </div>
                      <span className={`font-mono text-sm font-semibold flex-none ${t.promo ? "text-teal-600" : "text-slate-900"}`}>
                        {t.price[currency]}
                      </span>
                    </div>
                  </button>
                );
              })}
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
