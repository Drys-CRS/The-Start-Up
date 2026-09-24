import Link from "next/link";
import { getDashboard, portalConfigured } from "@/lib/portal";
import { Card, Empty, NotConfigured, Pill, Section, Table, Td, money, when } from "./ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const KIND_LABEL: Record<string, string> = {
  submitted: "Submitted",
  emailed: "Emailed",
  signed: "Signed",
  payment: "Payment",
  follow_up: "Follow-up",
  update_request: "Update request",
  unsubscribed: "Unsubscribed",
};

export default async function AdminDashboard() {
  if (!portalConfigured()) return <NotConfigured />;

  const d = await getDashboard();

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="New leads" value={d.leads7} hint={`${d.leads30} in 30 days`} />
        <Card label="Build Plans" value={d.plans7} hint={`${d.plans30} in 30 days`} />
        <Card label="Signed (30d)" value={d.signed30} tone={d.signed30 > 0 ? "good" : "default"} />
        <Card label="Paid (30d)" value={money(d.revenue30Cents)} hint={`${d.paid30} payments`} tone={d.paid30 > 0 ? "good" : "default"} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card
          label="Email problems (7d)"
          value={d.emailFailures7}
          hint="failed, bounced or complained"
          tone={d.emailFailures7 > 0 ? "warn" : "good"}
        />
        <Card label="Inbound emails" value={d.inboundTotal} hint="replies captured" />
      </div>

      <Section
        title="Pipeline"
        action={<Link href="/admin/deals" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">All deals →</Link>}
      >
        {d.byStage.length ? (
          <div className="flex flex-wrap gap-2">
            {d.byStage.map(s => (
              <span key={s.stage} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">{s.stage}</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">{s.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <Empty>
            No deals yet. Run the Monday import to bring in your history:{" "}
            <code>POST /api/dev/backfill</code>
          </Empty>
        )}
      </Section>

      <Section title="Latest activity">
        {d.recent.length ? (
          <Table head={["When", "Event", "What happened", "By"]}>
            {d.recent.map(a => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{when(a.created_at)}</Td>
                <Td><Pill>{KIND_LABEL[a.kind] || a.kind}</Pill></Td>
                <Td>{a.body}</Td>
                <Td className="text-slate-500 dark:text-slate-400">{a.actor}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nothing recorded yet. Activity appears here as leads, Build Plans, signatures and payments come in.</Empty>
        )}
      </Section>
    </>
  );
}
