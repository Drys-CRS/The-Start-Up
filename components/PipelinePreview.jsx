"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Decorative, self-animating pipeline preview for the homepage hero — a stand-in
// for "what the product actually does," the same role a code snippet plays on a
// dev-tool site. One lead auto-advances through stages on a timer to sell the
// "leads move themselves" pitch at a glance. Not wired to any real data.

const COLUMNS = ["New", "Qualified", "Won"];
const HEAT_DOT = { hot: "bg-teal-500", warm: "bg-teal-300", cold: "bg-slate-300 dark:bg-slate-600" };

const BASE_LEADS = [
  { id: "a", company: "Harbor & Vale", value: "$8,400", heat: "hot" },
  { id: "b", company: "Lumen Digital", value: "$4,200", heat: "warm" },
  { id: "c", company: "Northgate Co.", value: "$12,000", heat: "hot" },
  { id: "d", company: "Practical Labs", value: "$3,100", heat: "cold" },
  { id: "e", company: "Aster Group", value: "$9,600", heat: "hot" },
];

export default function PipelinePreview() {
  const [stages, setStages] = useState({ a: 0, b: 0, c: 1, d: 1, e: 2 });

  useEffect(() => {
    const id = setInterval(() => {
      setStages((prev) => ({ ...prev, a: (prev.a + 1) % 3 }));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden w-full">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">Your Pipeline</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-teal-600 dark:text-teal-400">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-teal-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          Live
        </span>
      </div>

      <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
        {COLUMNS.map((col, ci) => (
          <div key={col} className="bg-white dark:bg-slate-900 p-2.5 sm:p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{col}</span>
              <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600">
                {BASE_LEADS.filter((l) => stages[l.id] === ci).length}
              </span>
            </div>
            <div className="space-y-2 min-h-[130px] sm:min-h-[150px]">
              <AnimatePresence>
                {BASE_LEADS.filter((l) => stages[l.id] === ci).map((lead) => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 sm:p-2.5"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`h-1.5 w-1.5 flex-none rounded-full ${HEAT_DOT[lead.heat]}`} />
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{lead.company}</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-teal-600 dark:text-teal-400">{lead.value}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
