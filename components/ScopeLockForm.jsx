"use client";
import React, { useState, useRef } from "react";
import { ArrowRight, Check, Download, FileText, Globe, Loader2, PenLine, ShieldCheck, Sparkles, X } from "lucide-react";
import WordMark from "./WordMark";

const OFFER_DEADLINE = "30 Sep 2026";

const TIERS = [
  {
    value: "PROMOTIONAL (Base + Free 2 Months)",
    label: "Promotional",
    sublabel: "Base + Free 2 Months",
    price: { USD: "$1,500 flat", ZAR: "R30,000 flat" },
    wasPrice: { USD: "$3,000", ZAR: "R60,000" },
    note: { USD: "30-day build · 60 days support FREE", ZAR: "30-day build · 60 days support FREE" },
    promo: true,
  },
  {
    value: "Premium",
    label: "Premium",
    sublabel: "120 days total",
    price: { USD: "$2,500 flat", ZAR: "R50,000 flat" },
    wasPrice: { USD: "$5,000", ZAR: "R100,000" },
    note: { USD: "30-day build · 60 days support · +30 days FREE", ZAR: "30-day build · 60 days support · +30 days FREE" },
    promo: false,
  },
];

export default function ScopeLockForm({ embedded = false, initialValues = {}, prefilledKeys = [] }) {
  const [currency, setCurrency] = useState("USD");
  const [f, setF] = useState({
    company: "", contact: "", email: "", tier: "PROMOTIONAL (Base + Free 2 Months)",
    goal: "", bottleneck: "", workflow: "", musthaves: "",
    integrations: "", startDate: "",
    ...initialValues,
  });
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState(false);

  // Auto-fill
  const [fillMode, setFillMode] = useState("website"); // "website" | "description"
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [prefilled, setPrefilled] = useState(new Set(prefilledKeys));
  const [vertical, setVertical] = useState("");
  const lastSubmission = useRef(null);
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    // Clear prefill highlight once user edits
    if (prefilled.has(k)) setPrefilled(prev => { const n = new Set(prev); n.delete(k); return n; });
  };

  async function applyFillResult(res) {
    if (!res.ok) throw new Error(await res.text());
    const suggestions = await res.json();
    const FILLABLE = ["company", "goal", "bottleneck", "workflow", "musthaves", "integrations"];
    const filled = {};
    for (const k of FILLABLE) {
      if (suggestions[k] && suggestions[k].trim()) filled[k] = suggestions[k].trim();
    }
    setF(prev => ({ ...prev, ...filled }));
    setPrefilled(new Set(Object.keys(filled)));
    if (suggestions.vertical) setVertical(suggestions.vertical);
  }

  async function analyzeDomain() {
    const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!d) return;
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      const res = await fetch("/api/analyze-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: d }),
      });
      await applyFillResult(res);
    } catch {
      setAnalyzeError("Could not analyse that domain — fill in the form manually below.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function analyzeDescription() {
    if (!description.trim()) return;
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      const res = await fetch("/api/fill-from-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      await applyFillResult(res);
    } catch {
      setAnalyzeError("Could not expand that description — fill in the form manually below.");
    } finally {
      setAnalyzing(false);
    }
  }

  const valid = f.company && /.+@.+\..+/.test(f.email) && f.goal && f.bottleneck;

  async function submit() {
    if (!valid) return;
    setStatus("sending");
    const payload = { ...f, currency };
    try {
      const res = await fetch("/api/scope-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        lastSubmission.current = { ...payload, mondayItemId: data.itemId, refNo: data.refNo };
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  }

  async function downloadProposal() {
    if (!lastSubmission.current || downloading) return;
    setDownloading(true);
    setDlError(false);
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastSubmission.current),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const company = (lastSubmission.current.company || "build-plan")
        .replace(/[^a-z0-9]/gi, "-").toLowerCase();
      a.download = `proposal-${company}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setDlError(true);
    } finally {
      setDownloading(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 transition-colors";
  // Ring variant applied to pre-filled fields
  const inputFilled =
    "w-full rounded-lg border border-teal-400 dark:border-teal-600 bg-teal-50/40 dark:bg-teal-950/20 ring-1 ring-teal-300 dark:ring-teal-700 px-3 py-2.5 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors";
  const inp = (k) => prefilled.has(k) ? inputFilled : input;
  const label = "block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5";

  if (status === "done") {
    const s = lastSubmission.current || {};
    const selectedTier = TIERS.find((t) => t.value === s.tier) || TIERS[0];
    const cur = s.currency || "USD";
    const tierKey = selectedTier.promo ? "promo" : "premium";
    const signHref = `/sign?ref=${encodeURIComponent(s.refNo || "")}&item=${encodeURIComponent(s.mondayItemId || "")}&t=${tierKey}&c=${cur}&e=${encodeURIComponent(s.email || "")}`;

    const Row = ({ label: l, value: v }) =>
      v ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{l}</p>
          <p className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{v}</p>
        </div>
      ) : null;

    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans py-12 px-5">
        <div className="mx-auto max-w-lg">

          {/* Header */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500">
              <Check className="h-6 w-6 text-white" strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Your Build Plan is in.</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              We will turn this into a fixed scope, price, and start date — sent to your email. No call needed.
            </p>
          </div>

          {/* Submission summary card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">

            {/* Tier banner */}
            <div className="flex items-center justify-between bg-slate-900 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                  {selectedTier.label} · 50% Off
                </p>
                <p className="mt-0.5 flex items-baseline gap-2 text-lg font-bold text-white">
                  <span className="text-sm font-normal text-slate-400 line-through">{selectedTier.wasPrice[cur]}</span>
                  {selectedTier.price[cur]}
                </p>
              </div>
              <p className="text-xs text-slate-400 text-right max-w-[140px]">
                {selectedTier.note[cur]}
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Company" value={s.company} />
                <Row label="Contact" value={s.contact} />
              </div>
              <Row label="Email" value={s.email} />
              {(s.goal || s.bottleneck || s.workflow || s.musthaves || s.integrations || s.startDate) && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <Row label="Business objective" value={s.goal} />
                  <Row label="Current bottleneck" value={s.bottleneck} />
                  <Row label="Core workflow" value={s.workflow} />
                  <Row label="Must-have features" value={s.musthaves} />
                  <Row label="Integrations" value={s.integrations} />
                  <Row label="Proposed start date" value={s.startDate} />
                </div>
              )}
            </div>

            {/* Action strip */}
            <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-5 space-y-3">

              {/* PRIMARY: Sign & Pay */}
              <a href={signHref} className="block">
                <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer">
                  <PenLine className="h-4 w-4" /> Sign Agreement &amp; Pay
                </div>
              </a>
              <p className="text-xs text-slate-500 text-center">
                Sign your agreement digitally and complete payment — no printing required.
              </p>

              {/* SECONDARY: PDF download */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Optional
                </p>
                <button
                  onClick={downloadProposal}
                  disabled={downloading}
                  className={
                    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border " +
                    (downloading
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
                  }
                >
                  {downloading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Download className="h-4 w-4" /> Download Proposal PDF</>
                  )}
                </button>
                {dlError && (
                  <p className="mt-2 text-xs text-rose-500 text-center">
                    PDF generation failed — please try again.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
              Back to the start <ArrowRight className="h-4 w-4" />
            </a>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans"}>
      <div className={embedded ? "" : "mx-auto max-w-2xl px-5 py-10 sm:py-14"}>
        {!embedded && (
          <a href="/" className="mb-10 inline-block">
            <WordMark />
          </a>
        )}

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Your Build Plan</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-xl">
          {embedded
            ? "We've carried your numbers over. A few more questions turn this into a fixed build — exactly what we'll fix, the price, and the date we ship it. No call."
            : "A few questions turn this into a fixed build — exactly what we will fix, the price, and the date we ship it. No call, no vague scope. You approve it, the build begins."}
        </p>

        {/* Auto-fill — tabbed: Website URL | Quick Description */}
        <div className="mt-6 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-teal-800 dark:text-teal-300">
              Pre-fill the form automatically
            </span>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-lg border border-teal-200 dark:border-teal-700 bg-white dark:bg-slate-800 p-0.5 mb-3 w-fit text-xs font-semibold">
            {[
              { id: "website",     label: "Website URL",       icon: Globe },
              { id: "description", label: "Quick Description", icon: Sparkles },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setFillMode(id); setAnalyzeError(""); }}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors " +
                  (fillMode === id
                    ? "bg-teal-600 text-white"
                    : "text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700")}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          {fillMode === "website" ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && analyzeDomain()}
                  placeholder="yourbusiness.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors"
                />
              </div>
              <button
                onClick={analyzeDomain}
                disabled={analyzing || !domain.trim()}
                className={"flex-shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors " +
                  (analyzing || !domain.trim()
                    ? "bg-teal-200 dark:bg-teal-900 text-teal-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 text-white cursor-pointer")}
              >
                {analyzing
                  ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Analysing…</span>
                  : "Analyse"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={e => e.key === "Enter" && e.metaKey && analyzeDescription()}
                rows={3}
                maxLength={600}
                placeholder="Describe your app in 1–3 sentences. e.g. &quot;A booking platform for mobile dog groomers — customers book online, groomers manage their schedule and get paid on completion.&quot;"
                className="w-full rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-teal-600 dark:text-teal-500">
                  {description.length}/600 · Keep it short — 1–3 sentences is enough
                </span>
                <button
                  onClick={analyzeDescription}
                  disabled={analyzing || !description.trim()}
                  className={"flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors " +
                    (analyzing || !description.trim()
                      ? "bg-teal-200 dark:bg-teal-900 text-teal-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700 text-white cursor-pointer")}
                >
                  {analyzing
                    ? <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Expanding…</span>
                    : "Fill form"}
                </button>
              </div>
            </div>
          )}

          {analyzeError && (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{analyzeError}</p>
          )}

          {vertical && prefilled.size > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-teal-700 dark:text-teal-400">
                <span className="font-semibold">Detected:</span> {vertical} — {prefilled.size} fields pre-filled below. Review and edit before submitting.
              </p>
              <button
                onClick={() => { setPrefilled(new Set()); setVertical(""); setDomain(""); setDescription(""); }}
                className="text-teal-500 hover:text-teal-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm space-y-5">
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
              <input className={inp("company")} value={f.company} onChange={set("company")} placeholder="Acme Co." />
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
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                          : "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                          selected
                            ? t.promo ? "border-teal-500 bg-teal-500" : "border-slate-900 bg-slate-900"
                            : "border-slate-300 dark:border-slate-600"
                        }`}>
                          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${selected && t.promo ? "text-teal-700 dark:text-teal-400" : "text-slate-900 dark:text-white"}`}>
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
                      <span className="flex items-baseline gap-1.5 flex-none">
                        <span className="font-mono text-xs text-slate-400 line-through">{t.wasPrice[currency]}</span>
                        <span className={`font-mono text-sm font-semibold ${t.promo ? "text-teal-600" : "text-slate-900"}`}>
                          {t.price[currency]}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={label}>What outcome are you buying? *</label>
            <textarea className={inp("goal")} rows={2} value={f.goal} onChange={set("goal")}
              placeholder="e.g. Stop losing inbound leads to slow follow-up; give leadership real pipeline visibility." />
          </div>
          <div>
            <label className={label}>Your single biggest bottleneck right now *</label>
            <textarea className={inp("bottleneck")} rows={2} value={f.bottleneck} onChange={set("bottleneck")}
              placeholder="e.g. Leads sit in a shared inbox; reps update a CRM nobody trusts." />
          </div>
          <div>
            <label className={label}>The one core workflow this must handle</label>
            <textarea className={inp("workflow")} rows={2} value={f.workflow} onChange={set("workflow")}
              placeholder="e.g. Lead arrives → scored → routed to an owner → appears on a rep's Monday board → reported weekly." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Must-have features</label>
              <textarea className={inp("musthaves")} rows={2} value={f.musthaves} onChange={set("musthaves")}
                placeholder="The non-negotiables." />
            </div>
            <div>
              <label className={label}>Integrations needed</label>
              <input className={inp("integrations")} value={f.integrations} onChange={set("integrations")}
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
            {status === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Get My Build Plan <ArrowRight className="h-4 w-4" /></>}
          </button>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Goes straight to our pipeline. We reply with scope, price, and a start date.
          </p>
        </div>
      </div>
    </div>
  );
}
