import Link from "next/link";
import { listDeals, portalConfigured, type DealRow } from "@/lib/portal";
import { buildPrompt, recommendStack, type BuildScope } from "@/lib/build-prompt";
import { mondayItemUrl } from "@/lib/links";
import { SCOPE_BOARD_ID } from "@/lib/monday";
import { Empty, NotConfigured, Pill } from "../ui";
import PromptCard from "./PromptCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Builds" };

// Build Plans that made it to Monday, with the Claude Code prompt for each.
//
// The prompt is generated here on the server from the scope already stored,
// so it is the same prompt every time it is opened and it does not depend on
// an AI provider being up. See lib/build-prompt.ts.

const scopeOf = (d: DealRow): BuildScope => ({
  refNo: d.ref_no,
  company: d.company,
  contact: d.contact,
  tier: d.tier,
  goal: d.goal,
  bottleneck: d.bottleneck,
  workflow: d.workflow,
  musthaves: d.musthaves,
  integrations: d.integrations,
  startDate: d.start_date,
  mondayItemId: d.monday_item_id,
});

// Scoping is done and the work is real: these are the ones worth a prompt.
const READY = new Set(["Signed", "Deposit Paid", "Planning", "Build Active", "In Build", "Delivered"]);

export default async function AdminBuilds({ searchParams }: { searchParams: { all?: string } }) {
  if (!portalConfigured()) return <NotConfigured />;

  const showAll = searchParams?.all === "1";
  const deals = (await listDeals()).filter(d => d.monday_item_id && (showAll || READY.has((d.stage || "").trim())));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {showAll
            ? "Every Build Plan that reached Monday."
            : "Build Plans that reached Monday and are past scoping."}{" "}
          {deals.length} shown.
        </p>
        <Link
          href={showAll ? "/admin/builds" : "/admin/builds?all=1"}
          className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
        >
          {showAll ? "Only ones in build →" : "Show every Build Plan →"}
        </Link>
      </div>

      <div className="mt-5 space-y-4">
        {deals.length ? (
          deals.map(d => {
            const scope = scopeOf(d);
            const thin = [d.goal, d.workflow, d.musthaves].filter(v => v && v.trim()).length < 2;
            return (
              <section
                key={d.id}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                      {d.company || "(no company)"}
                    </h2>
                    <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                      {d.ref_no}
                      {d.tier ? ` · ${d.tier}` : ""}
                      {d.start_date ? ` · starts ${d.start_date}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={d.stage === "Delivered" ? "good" : "info"}>{d.stage || "no stage"}</Pill>
                    <Link
                      href={`/admin/deals/${encodeURIComponent(d.ref_no)}`}
                      className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
                    >
                      Deal
                    </Link>
                    {d.monday_item_id && (
                      <a
                        href={mondayItemUrl(SCOPE_BOARD_ID, d.monday_item_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
                      >
                        Monday
                      </a>
                    )}
                  </div>
                </div>

                {thin && (
                  <p className="mt-3 rounded-lg border border-amber-300 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/60 dark:text-amber-400">
                    This Build Plan is thin: the prompt will tell Claude Code to ask before building, rather than
                    invent a scope. Worth filling the gaps with the client first.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recommendStack(scope).map(r => (
                    <span
                      key={r.area}
                      title={r.because}
                      className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    >
                      {r.area}: {r.choice.split(",")[0]}
                    </span>
                  ))}
                </div>

                <PromptCard prompt={buildPrompt(scope)} label={d.ref_no} />
              </section>
            );
          })
        ) : (
          <Empty>
            Nothing here yet. A Build Plan appears once it has been written to Monday, and by default once it is
            past scoping.
          </Empty>
        )}
      </div>
    </>
  );
}
