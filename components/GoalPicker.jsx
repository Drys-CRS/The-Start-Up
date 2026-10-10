"use client";
import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

// Typeform-style multi-select question, used as the first question in the Build Plan.
//
// Presentational only: the selection lives in ScopeLockForm's `f` state, so it rides
// the existing payload, prefill and success-screen machinery rather than duplicating it.
//
// Keyboard: a letter toggles its option, Enter confirms. The document-level listener
// bails out whenever focus is in a field, so typing anywhere else on the page — the
// auto-fill inputs, the form's own textareas — is never hijacked.

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const OTHER_LABEL = "Something else";

export default function GoalPicker({
  number = 1,
  question,
  helper = "Choose as many as you like",
  options,
  value = [],
  onToggle,
  other = "",
  onOther,
  onConfirm,
}) {
  const reduce = useReducedMotion();
  const rows = useMemo(() => [...options, OTHER_LABEL], [options]);
  const otherSelected = value.includes(OTHER_LABEL);

  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const tag = t?.tagName;
      // Never steal a keystroke meant for a field.
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;

      const i = LETTERS.indexOf((e.key || "").toUpperCase());
      if (i > -1 && i < rows.length) {
        e.preventDefault();
        onToggle(rows[i]);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        // A focused option row handles its own Enter natively.
        if (t?.closest?.("[data-goal-option]")) return;
        e.preventDefault();
        onConfirm?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [rows, onToggle, onConfirm]);

  const rowBase =
    "group flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";
  const rowOn = " border-teal-500 bg-teal-50 dark:bg-teal-900/20";
  const rowOff =
    " border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500";
  const keyBase =
    "flex h-6 w-6 flex-none items-center justify-center rounded-md border font-mono text-[11px] font-semibold";
  const keyOn = " border-teal-500 bg-teal-500 text-white";
  const keyOff =
    " border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400";

  return (
    <div role="group" aria-labelledby="goals-question" aria-describedby="goals-helper">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-500 dark:text-slate-400"
        >
          {number}
        </span>
        <h2
          id="goals-question"
          className="font-mono text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          {question}
        </h2>
      </div>

      <p id="goals-helper" className="mt-1.5 sm:ml-9 text-sm text-slate-500 dark:text-slate-400">
        {helper}
      </p>

      <div className="mt-4 sm:ml-9 space-y-2.5">
        {rows.map((label, i) => {
          const selected = value.includes(label);
          return (
            <motion.button
              key={label}
              type="button"
              data-goal-option
              aria-pressed={selected}
              aria-keyshortcuts={LETTERS[i]}
              onClick={() => onToggle(label)}
              whileHover={reduce ? undefined : { scale: 1.005 }}
              whileTap={reduce ? undefined : { scale: 0.995 }}
              transition={{ duration: reduce ? 0 : 0.15 }}
              className={rowBase + (selected ? rowOn : rowOff)}
            >
              <span aria-hidden="true" className={keyBase + (selected ? keyOn : keyOff)}>
                {LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1 font-mono text-sm leading-snug break-words text-slate-900 dark:text-white">
                {label}
              </span>
              {selected && <Check className="h-4 w-4 flex-none text-teal-600 dark:text-teal-400" aria-hidden="true" />}
            </motion.button>
          );
        })}
      </div>

      {otherSelected && (
        <div className="mt-2.5 sm:ml-9">
          {/* Single line on purpose: a newline survives to Monday but flattens in the PDF. */}
          <input
            value={other}
            onChange={e => onOther(e.target.value)}
            maxLength={120}
            aria-label="Describe your other goal"
            placeholder="In a few words, what else matters most?"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 transition-colors"
          />
        </div>
      )}

      <div className="mt-4 sm:ml-9 flex items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!value.length}
          className={
            "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors " +
            (value.length
              ? "bg-teal-500 text-white hover:bg-teal-600"
              : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed")
          }
        >
          OK
          <span className="text-[11px] opacity-70">Enter</span>
        </button>
        <span className="text-xs text-slate-400 dark:text-slate-500">or press a letter</span>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {value.length} of {rows.length} selected
      </p>
    </div>
  );
}
