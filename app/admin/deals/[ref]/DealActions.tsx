"use client";

import { useState, useTransition } from "react";
import { addNote, changeStage, replyToCustomer, resendConfirmation, type ActionResult } from "../../actions";

// The interactive half of a deal page: reply, move stage, re-send the confirmation,
// or leave a private note. Kept in a client component so the rest of the page stays
// server-rendered.

const STAGES = ["New", "Signed", "Reviewing", "Scoped & Sent", "Approved", "Deposit Paid", "Planning", "In Build", "Delivered"];

const box =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900";
const primary =
  "inline-flex items-center justify-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors";
const secondary =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

export default function DealActions({ refNo, stage, email }: { refNo: string; stage: string; email: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [nextStage, setNextStage] = useState(stage);

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      setResult(null);
      const r = await fn();
      setResult(r);
      if (r.ok && after) after();
    });

  return (
    <section className="mt-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</h2>

      {result ? (
        <p className={`mt-3 text-sm ${result.ok ? "text-teal-700 dark:text-teal-300" : "text-red-600 dark:text-red-400"}`}>
          {result.message}
        </p>
      ) : null}

      <div className="mt-4 space-y-5">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Reply to {email || "customer"}
          </label>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            rows={4}
            placeholder="Sent from support@tsu.agency, threaded into the existing conversation."
            className={box}
          />
          <button
            onClick={() => run(() => replyToCustomer(refNo, reply), () => setReply(""))}
            disabled={pending || !reply.trim()}
            className={`${primary} mt-2`}
          >
            {pending ? "Working…" : "Send reply"}
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Stage
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select value={nextStage} onChange={e => setNextStage(e.target.value)} className={`${box} max-w-xs`}>
              {STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => run(() => changeStage(refNo, nextStage))}
              disabled={pending || nextStage === stage}
              className={secondary}
            >
              Move to {nextStage}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Writes to Monday first, then here.</p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Private note
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Only visible here." className={box} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => run(() => addNote(refNo, note), () => setNote(""))}
              disabled={pending || !note.trim()}
              className={secondary}
            >
              Add note
            </button>
            <button onClick={() => run(() => resendConfirmation(refNo))} disabled={pending} className={secondary}>
              Re-send confirmation email
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
