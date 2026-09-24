import { listDeals, portalConfigured } from "@/lib/portal";
import { DealLink, Empty, NotConfigured, Pill, Table, Td, ago, day, stageTone, usd, when } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deals" };

export default async function AdminDeals() {
  if (!portalConfigured()) return <NotConfigured />;

  const deals = await listDeals();
  const unsigned = deals.filter(d => d.stage === "New").length;

  return (
    <>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Every Build Plan, newest first. {deals.length} shown{unsigned ? `, ${unsigned} still unsigned` : ""}.
      </p>

      <div className="mt-4">
        {deals.length ? (
          <Table head={["Submitted", "Ref", "Company", "Email", "Stage", "In stage", "Signed", "Deposit"]}>
            {deals.map(d => (
              <tr key={d.id}>
                <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{when(d.created_at)}</Td>
                <Td className="whitespace-nowrap"><DealLink refNo={d.ref_no} /></Td>
                <Td className="font-medium text-slate-900 dark:text-white">{d.company}</Td>
                <Td>{d.email}</Td>
                <Td><Pill tone={stageTone(d.stage)}>{d.stage}</Pill></Td>
                <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{ago(d.stage_changed_at || d.created_at)}</Td>
                <Td className="whitespace-nowrap">{d.signed_at ? day(d.signed_at) : "—"}</Td>
                <Td className="whitespace-nowrap">{d.deposit_paid_at ? day(d.deposit_paid_at) : d.amount_usd ? usd(d.amount_usd) : "—"}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>
            No Build Plans recorded yet. To import your Monday history, run <code>POST /api/dev/backfill</code>.
          </Empty>
        )}
      </div>
    </>
  );
}
