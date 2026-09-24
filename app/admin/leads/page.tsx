import { listLeads, portalConfigured } from "@/lib/portal";
import { Empty, NotConfigured, Pill, Table, Td, usd, when } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

export default async function AdminLeads() {
  if (!portalConfigured()) return <NotConfigured />;

  const leads = await listLeads();

  return (
    <>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Every calculator submission and homepage enquiry, newest first. {leads.length} shown.
      </p>

      <div className="mt-4">
        {leads.length ? (
          <Table head={["When", "Source", "Company", "Email", "Industry", "Est. annual leak", "Reminders"]}>
            {leads.map(l => (
              <tr key={l.id}>
                <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{when(l.created_at)}</Td>
                <Td><Pill tone={l.kind === "calculator" ? "good" : "info"}>{l.kind === "calculator" ? "Calculator" : "Homepage"}</Pill></Td>
                <Td className="font-medium text-slate-900 dark:text-white">{l.company}</Td>
                <Td>{l.email || <span className="text-slate-400">no email</span>}</Td>
                <Td>{l.industry}</Td>
                <Td className="whitespace-nowrap">{usd(l.annual_leak)}</Td>
                <Td>
                  {l.unsubscribed_at
                    ? <Pill tone="warn">Unsubscribed</Pill>
                    : l.followups
                      ? <Pill>{l.followups}</Pill>
                      : "—"}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>
            No leads recorded yet. New submissions appear here automatically; to import your Monday history, run{" "}
            <code>POST /api/dev/backfill</code>.
          </Empty>
        )}
      </div>
    </>
  );
}
