"use client";
import { track } from "@vercel/analytics";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Download, FileText, Globe, Loader2, PenLine, ShieldCheck, Sparkles, X } from "lucide-react";
import WordMark from "./WordMark";
import GoalPicker, { OTHER_LABEL } from "./GoalPicker";
import { ADVANCED, TIER_CONFIG, priceFor, usd } from "@/lib/pricing";

const OFFER_DEADLINE = "31 Oct 2026";

// Price comes from lib/pricing so the form, the proposal and Stripe agree.
const PROMO = priceFor("promo");
const ADV = priceFor("advanced");

const TIERS = [
  {
    value: "PROMOTIONAL (Base + Free 2 Months)",
    label: "Promotional",
    sublabel: "Base + Free 2 Months",
    price: `${usd(PROMO.total)} flat`,
    wasPrice: usd(PROMO.early ? PROMO.standard : PROMO.list),
    note: "30-day build · 60 days support FREE · payment plan included · then optional $150/mo retainer",
    promo: true,
  },
  {
    value: TIER_CONFIG.advanced.value,
    label: "Advanced",
    sublabel: "Integration + AI layer",
    price: `${usd(ADV.total)} total`,
    wasPrice: null,
    note: `Keep your current systems · ${usd(ADV.deposit)} to start, ${usd(ADV.balance)} on handover · scoping call required`,
    promo: false,
    requiresCall: true,
  },
];

// Deliberately short and ASCII-only: the proposal PDF strips anything outside
// Latin-1 and re-wraps on whitespace, so bullets, arrows and em dashes get mangled.
const GOAL_OPTIONS = [
  "Stop leads going cold",
  "Cut manual admin and double entry",
  "See a real pipeline and forecast",
  "Respond to enquiries faster",
  "Automate follow-up and reminders",
];

// One flat line that reads correctly in Monday, the proposal PDF, the team alert
// and the admin deal page.
function composeGoals(goals = [], other = "") {
  const picked = goals.filter(g => g !== OTHER_LABEL);
  const extra = (other || "").trim().replace(/\s+/g, " ");
  if (goals.includes(OTHER_LABEL) && extra) picked.push(extra);
  return picked.length ? `Goals: ${picked.join("; ")}.` : "";
}

export default function ScopeLockForm({ embedded = false, initialValues = {}, prefilledKeys = [] }) {
  const [f, setF] = useState({
    company: "", contact: "", email: "", tier: "PROMOTIONAL (Base + Free 2 Months)",
    goal: "", bottleneck: "", workflow: "", musthaves: "",
    integrations: "", startDate: "",
    goals: [], goalOther: "",
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

  // Ticking goals writes the outcome box for them, until they type in it themselves.
  const [goalTouched, setGoalTouched] = useState(!!initialValues.goal);

  const markGoalPrefilled = () => {
    if (!goalTouched) setPrefilled(prev => (prev.has("goal") ? prev : new Set(prev).add("goal")));
  };

  const toggleGoal = (choice) => {
    setF(prev => {
      const goals = prev.goals.includes(choice)
        ? prev.goals.filter(g => g !== choice)
        : [...prev.goals, choice];
      return { ...prev, goals, ...(goalTouched ? {} : { goal: composeGoals(goals, prev.goalOther) }) };
    });
    markGoalPrefilled();
  };

  const setGoalOther = (text) => {
    setF(prev => ({
      ...prev,
      goalOther: text,
      ...(goalTouched ? {} : { goal: composeGoals(prev.goals, text) }),
    }));
    markGoalPrefilled();
  };

  // Their first keystroke in the outcome box ends the auto-writing for good.
  const onGoalTyped = (e) => {
    const value = e.target.value;
    setGoalTouched(true);
    setF(prev => ({ ...prev, goal: value }));
    if (prefilled.has("goal")) setPrefilled(prev => { const n = new Set(prev); n.delete("goal"); return n; });
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
      setAnalyzeError("Could not analyse that domain. Fill in the form manually below.");
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
      setAnalyzeError("Could not expand that description. Fill in the form manually below.");
    } finally {
      setAnalyzing(false);
    }
  }

  const hasGoal = !!(f.goal.trim() || (f.goals && f.goals.length));
  const valid = f.company && /.+@.+\..+/.test(f.email) && hasGoal && f.bottleneck;

  async function submit() {
    if (!valid) return;
    setStatus("sending");
    const payload = { ...f, goal: f.goal.trim() || composeGoals(f.goals, f.goalOther), currency: "USD" };
    try {
      const res = await fetch("/api/scope-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        lastSubmission.current = { ...payload, mondayItemId: data.itemId, refNo: data.refNo, emailed: !!data.emailed };
        track("Build Plan Submitted");
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
        <motion.div
          className="mx-auto max-w-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >

          {/* Header */}
          <div className="mb-7 text-center">
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "backOut" }}
            >
              <Check className="h-6 w-6 text-white" strokeWidth={3} />
            </motion.div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Your Build Plan is in.</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {s.emailed
                ? <>We&apos;ve emailed your signing link to {s.email}, so you can come back to it anytime.</>
                : "Sign your agreement below to lock in your start date."}{" "}
              No call needed.
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
                  <span className="text-sm font-normal text-slate-400 line-through">{selectedTier.wasPrice}</span>
                  {selectedTier.price}
                </p>
              </div>
              <p className="text-xs text-slate-400 text-right max-w-[140px]">
                {selectedTier.note}
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Company" value={s.company} />
                <Row label="Contact" value={s.contact} />
              </div>
              <Row label="Email" value={s.email} />
              {(s.goal || (s.goals && s.goals.length) || s.bottleneck || s.workflow || s.musthaves || s.integrations || s.startDate) && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <Row label="Goals chosen" value={(s.goals || []).join(", ")} />
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
                Sign your agreement digitally and complete payment. No printing required.
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
                    PDF generation failed. Please try again.
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

        </motion.div>
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
            ? "We've carried your numbers over. A few more questions turn this into a fixed build: exactly what we'll fix, the price, and the date we ship it. No call."
            : "A few questions turn this into a fixed build: exactly what we will fix, the price, and the date we ship it. No call, no vague scope. You approve it, the build begins."}
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

          <AnimatePresence mode="wait" initial={false}>
          {fillMode === "website" ? (
            <motion.div key="website" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }} className="flex flex-col sm:flex-row gap-2">
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
            </motion.div>
          ) : (
            <motion.div key="description" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }} className="space-y-2">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={e => e.key === "Enter" && e.metaKey && analyzeDescription()}
                rows={3}
                maxLength={600}
                placeholder="Describe your app in 1–3 sentences. e.g. &quot;A booking platform for mobile dog groomers: customers book online, groomers manage their schedule and get paid on completion.&quot;"
                className="w-full rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-teal-600 dark:text-teal-500">
                  {description.length}/600 · Keep it short, 1–3 sentences is enough
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
            </motion.div>
          )}
          </AnimatePresence>

          {analyzeError && (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{analyzeError}</p>
          )}

          {vertical && prefilled.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-3 flex items-center justify-between"
            >
              <p className="text-xs text-teal-700 dark:text-teal-400">
                <span className="font-semibold">Detected:</span> {vertical}, {prefilled.size} fields pre-filled below. Review and edit before submitting.
              </p>
              <button
                onClick={() => { setPrefilled(new Set()); setVertical(""); setDomain(""); setDescription(""); }}
                className="text-teal-500 hover:text-teal-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm space-y-5">
          <GoalPicker
            number={1}
            question="What are your most important goals?"
            options={GOAL_OPTIONS}
            value={f.goals}
            onToggle={toggleGoal}
            other={f.goalOther}
            onOther={setGoalOther}
            onConfirm={() => document.getElementById("goal-free")?.focus()}
          />

          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <span className={label + " mb-0"}>Your engagement</span>
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
            <span className={label}>Your package</span>
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
                          <p className="text-xs text-slate-500 mt-0.5">{t.note}</p>
                        </div>
                      </div>
                      <span className="flex items-baseline gap-1.5 flex-none">
                        {t.wasPrice && <span className="font-mono text-xs text-slate-400 line-through">{t.wasPrice}</span>}
                        <span className={`font-mono text-sm font-semibold ${t.promo ? "text-teal-600" : "text-slate-900"}`}>
                          {t.price}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            {f.tier === TIER_CONFIG.advanced.value && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-800/60 dark:bg-amber-950/30">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Before you pick this, two things</p>
                <ul className="mt-1.5 space-y-1 pl-4 text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                  {ADVANCED.requires.map((r) => (
                    <li key={r} className="list-disc">{r}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">{ADVANCED.caveat}</p>
              </div>
            )}
          </div>

          <div>
            <label className={label}>What outcome are you buying? *</label>
            <textarea id="goal-free" className={inp("goal")} rows={2} value={f.goal} onChange={onGoalTyped}
              placeholder="e.g. Stop losing inbound leads to slow follow-up; give leadership real pipeline visibility." />
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              Filled in from the goals you picked above. Edit it or add anything else.
            </p>
          </div>
          <div>
            <label className={label}>Your single biggest bottleneck right now *</label>
            <textarea className={inp("bottleneck")} rows={2} value={f.bottleneck} onChange={set("bottleneck")}
              placeholder="e.g. Leads sit in a shared inbox; reps update a CRM nobody trusts." />
          </div>
          <div>
            <label className={label}>The one core workflow this must handle</label>
            <textarea className={inp("workflow")} rows={2} value={f.workflow} onChange={set("workflow")}
              placeholder="e.g. Lead arrives → scored → routed to an owner → appears on a rep's pipeline board → reported weekly." />
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

          <motion.button onClick={submit} disabled={!valid || status === "sending"}
            whileHover={valid && status !== "sending" ? { scale: 1.01 } : {}}
            whileTap={valid && status !== "sending" ? { scale: 0.98 } : {}}
            className={"inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors " +
              (valid && status !== "sending" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-400 cursor-not-allowed")}>
            {status === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Get My Build Plan <ArrowRight className="h-4 w-4" /></>}
          </motion.button>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Goes straight to our pipeline. We reply with scope, price, and a start date.
          </p>
        </div>
      </div>
    </div>
  );
}
