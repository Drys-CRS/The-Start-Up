"use client";

import { useState, useTransition } from "react";
import { rewriteDescription } from "./actions";

export type ProductRow = { id: string; name: string; description: string | null; suggestion: string };

// Product descriptions are customer-facing: they show on the Stripe-hosted
// checkout page and on receipts. A description quoting R60,000 is the one
// piece of ZAR a customer can still actually see.
export default function DescriptionFixer({ products }: { products: ProductRow[] }) {
  const flagged = products.filter(p => /\bR\s?\d|\bZAR\b|rand|30 sep/i.test(p.description || ""));
  if (!flagged.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No description quotes Rand or a dead date.</p>;
  }
  return (
    <div className="space-y-4">
      {flagged.map(p => (
        <Row key={p.id} product={p} />
      ))}
    </div>
  );
}

function Row({ product }: { product: ProductRow }) {
  const [text, setText] = useState(product.suggestion);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="rounded-lg border border-amber-300 p-3.5 dark:border-amber-800/60">
      <p className="text-sm font-medium text-slate-900 dark:text-white">{product.name}</p>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
        Now: {product.description || "—"}
      </p>
      <textarea
        rows={3}
        value={text}
        onChange={e => setText(e.target.value)}
        className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white p-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          disabled={pending || !text.trim()}
          onClick={() => start(async () => setResult(await rewriteDescription(product.id, text)))}
          className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
        >
          {pending ? "Saving" : "Replace in Stripe"}
        </button>
        {result && (
          <span className={`text-xs ${result.ok ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"}`}>
            {result.message}
          </span>
        )}
      </div>
    </div>
  );
}
