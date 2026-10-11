"use client";

import { useState, useTransition } from "react";
import type { StaleItem } from "@/lib/stripe-admin";
import { archiveSelected } from "./actions";

// Non-USD items are ticked on arrival, because that is the clean-up being
// asked for. Payment Links are not: one may still be sitting in a customer's
// inbox, and archiving it breaks their link with no warning to them.
const defaultChecked = (item: StaleItem) => item.kind !== "payment_link";

export default function StripeActions({ items }: { items: StaleItem[] }) {
  const [picked, setPicked] = useState<Record<string, boolean>>(
    () => Object.fromEntries(items.map(i => [i.id, defaultChecked(i)])),
  );
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  if (!items.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Nothing stale. The account is clean.</p>;
  }

  const chosen = items.filter(i => picked[i.id]);

  return (
    <div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map(item => (
          <li key={item.id} className="flex items-start gap-3 py-2.5">
            <input
              type="checkbox"
              checked={!!picked[item.id]}
              onChange={e => setPicked(p => ({ ...p, [item.id]: e.target.checked }))}
              className="mt-1 h-4 w-4 flex-none accent-teal-500"
              id={`pick-${item.id}`}
            />
            <label htmlFor={`pick-${item.id}`} className="min-w-0 flex-1 cursor-pointer">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</span>
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{item.kind}</span>
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{item.detail}</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.reason}</p>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          disabled={pending || chosen.length === 0}
          onClick={() =>
            start(async () => {
              setResult(await archiveSelected(chosen.map(i => ({ kind: i.kind, id: i.id }))));
            })
          }
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {pending ? "Archiving" : `Archive ${chosen.length} selected`}
        </button>
        {result && (
          <span className={`text-sm ${result.ok ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"}`}>
            {result.message}
          </span>
        )}
      </div>
    </div>
  );
}
