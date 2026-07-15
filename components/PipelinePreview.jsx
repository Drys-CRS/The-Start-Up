"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";

// Decorative, self-animating pipeline preview — a stand-in for "what the product
// actually does," the same role a code snippet plays on a dev-tool site. Not wired
// to any real data. Four stages tell the customer's actual journey as they scroll:
//   "broken"     — hero: a messy, untracked pile of leads (the pain point)
//   "organizing" — mid-page: leads snapping into a real pipeline
//   "ai"         — pre-FAQ: the AI layer switching on (scoring, routing)
//   "complete"   — final CTA: the whole system running itself, live

const COLUMNS = ["New", "Qualified", "Won"];
const HEAT_DOT = { hot: "bg-teal-500", warm: "bg-teal-300", cold: "bg-slate-300 dark:bg-slate-600" };

const BASE_LEADS = [
  { id: "a", company: "Harbor & Vale", value: "$8,400",  heat: "hot",  stale: "14d untouched" },
  { id: "b", company: "Lumen Digital", value: "$4,200",  heat: "warm", stale: "9d untouched" },
  { id: "c", company: "Northgate Co.", value: "$12,000", heat: "hot",  stale: "21d untouched" },
  { id: "d", company: "Practical Labs", value: "$3,100", heat: "cold", stale: "6d untouched" },
  { id: "e", company: "Aster Group",   value: "$9,600",  heat: "hot",  stale: "11d untouched" },
];

const SCATTER_ROTATE = ["-rotate-3", "rotate-2", "-rotate-2", "rotate-3", "-rotate-1"];
const SCATTER_OFFSET = [
  { x: -6, y: 3 }, { x: 8, y: -4 }, { x: -3, y: 5 }, { x: 5, y: -3 }, { x: -5, y: 2 },
];

function Chrome({ stage, children }) {
  return (
    <motion.div
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden w-full"
      animate={
        stage === "ai"
          ? { boxShadow: ["0 0 0 0 rgba(20,184,166,0)", "0 0 0 10px rgba(20,184,166,0.14)", "0 0 0 0 rgba(20,184,166,0)"] }
          : { boxShadow: "0 0 0 0 rgba(20,184,166,0)" }
      }
      transition={stage === "ai" ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">Your Pipeline</span>
        <span className="ml-auto">
          {stage === "broken" && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Untracked
            </span>
          )}
          {stage === "organizing" && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Organizing…
            </span>
          )}
          {stage === "ai" && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-teal-600 dark:text-teal-400">
              <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                <Sparkles className="h-3 w-3" />
              </motion.span>
              AI Active
            </span>
          )}
          {stage === "complete" && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-teal-600 dark:text-teal-400">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-teal-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              Live
            </span>
          )}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

function LeadCard({ lead, className = "", showValue = true }) {
  return (
    <div className={`rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 sm:p-2.5 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {showValue && <span className={`h-1.5 w-1.5 flex-none rounded-full ${HEAT_DOT[lead.heat]}`} />}
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{lead.company}</span>
      </div>
      {showValue ? (
        <span className="text-[10px] sm:text-[11px] font-mono text-teal-600 dark:text-teal-400">{lead.value}</span>
      ) : (
        <span className="text-[10px] sm:text-[11px] font-mono text-amber-600 dark:text-amber-500">{lead.stale}</span>
      )}
    </div>
  );
}

function BrokenBoard() {
  return (
    <div className="p-3 sm:p-4">
      <p className="mb-3 text-[11px] text-slate-400 dark:text-slate-500">5 leads, no clear next step, nobody owns the follow-up.</p>
      <div className="flex flex-wrap gap-2.5">
        {BASE_LEADS.map((lead, i) => (
          <motion.div
            key={lead.id}
            className={`w-[46%] sm:w-[30%] ${SCATTER_ROTATE[i % SCATTER_ROTATE.length]}`}
            style={{ marginTop: i % 2 === 0 ? 0 : 10 }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
          >
            <motion.div
              animate={i % 2 === 0 ? { rotate: [0, -4, 0, 3, 0] } : { y: [0, -3, 0] }}
              transition={{
                duration: 3.5 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6 + i * 0.4,
              }}
            >
              <LeadCard lead={lead} showValue={false} />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function OrganizingBoard() {
  return (
    <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
      {COLUMNS.map((col, ci) => (
        <div key={col} className="bg-white dark:bg-slate-900 p-2.5 sm:p-3">
          <div className="mb-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{col}</div>
          <div className="space-y-2 min-h-[130px] sm:min-h-[150px]">
            {BASE_LEADS.filter((_, i) => i % 3 === ci).map((lead, i) => {
              const off = SCATTER_OFFSET[(ci + i) % SCATTER_OFFSET.length];
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: off.x * 4, y: off.y * 4, rotate: off.x }}
                  whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: "easeOut" }}
                >
                  <LeadCard lead={lead} />
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AIBoard() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
        {COLUMNS.map((col, ci) => (
          <div key={col} className="bg-white dark:bg-slate-900 p-2.5 sm:p-3">
            <div className="mb-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{col}</div>
            <div className="space-y-2 min-h-[110px] sm:min-h-[130px]">
              {BASE_LEADS.filter((_, i) => i % 3 === ci).map((lead, i) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: 0.1 + (ci * 2 + i) * 0.08, ease: "easeOut" }}
                >
                  <LeadCard lead={lead} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
        className="flex items-center gap-2 border-t border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 px-3 sm:px-4 py-2.5"
      >
        <Sparkles className="h-3.5 w-3.5 flex-none text-teal-600 dark:text-teal-400" />
        <span className="text-[10px] sm:text-[11px] font-medium text-teal-700 dark:text-teal-300">
          Auto-routed 2 new leads · Flagged 1 at risk of going cold
        </span>
      </motion.div>
    </div>
  );
}

function CompleteBoard() {
  const [stages, setStages] = useState({ a: 0, b: 0, c: 1, d: 1, e: 2 });

  useEffect(() => {
    const id = setInterval(() => {
      setStages((prev) => ({ ...prev, a: (prev.a + 1) % 3 }));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
      {COLUMNS.map((col, ci) => (
        <div key={col} className="bg-white dark:bg-slate-900 p-2.5 sm:p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{col}</span>
            <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600">
              {BASE_LEADS.filter((l) => stages[l.id] === ci).length}
            </span>
          </div>
          {/* Fixed height (not min-h): lead "a" cycles between columns, so a column can
              briefly hold 3 cards. A fixed height sized for the max keeps the widget from
              growing/shrinking and jolting the CTA buttons below. */}
          <div className="space-y-2 h-[192px] sm:h-[208px]">
            <AnimatePresence>
              {BASE_LEADS.filter((l) => stages[l.id] === ci).map((lead) => (
                <motion.div
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <LeadCard lead={lead} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PipelinePreview({ stage = "complete" }) {
  return (
    <Chrome stage={stage}>
      {stage === "broken" && <BrokenBoard />}
      {stage === "organizing" && <OrganizingBoard />}
      {stage === "ai" && <AIBoard />}
      {stage === "complete" && <CompleteBoard />}
    </Chrome>
  );
}
