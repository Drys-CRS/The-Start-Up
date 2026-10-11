"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, Download } from "lucide-react";

// Copy is the whole point of the page, so it is the primary button and it
// does not require expanding anything first.
export default function PromptCard({ prompt, label }: { prompt: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Clipboard is blocked outside a secure context and in some embedded
      // browsers. Open the text so it can be selected by hand rather than
      // failing silently.
      setOpen(true);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([prompt], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-prompt-${label}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy Claude prompt"}
        </button>
        <button
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300"
        >
          <Download className="h-3.5 w-3.5" /> .md
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {open ? "Hide" : "Read it first"}
        </button>
        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
          {prompt.length.toLocaleString("en-US")} characters
        </span>
      </div>

      {open && (
        <pre className="mt-3 max-h-[28rem] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          {prompt}
        </pre>
      )}
    </div>
  );
}
