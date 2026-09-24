import Link from "next/link";
import { listEmails, portalConfigured } from "@/lib/portal";
import { Empty, NotConfigured, Pill, Table, Td, statusTone, when } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email log" };

export default async function AdminEmails({ searchParams }: { searchParams: { problems?: string } }) {
  if (!portalConfigured()) return <NotConfigured />;

  const problemsOnly = searchParams?.problems === "1";
  const emails = await listEmails({ problemsOnly });

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {problemsOnly ? "Emails that failed, bounced or were marked spam." : "Every email sent and received, newest first."}{" "}
          {emails.length} shown.
        </p>
        <Link
          href={problemsOnly ? "/admin/emails" : "/admin/emails?problems=1"}
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
        >
          {problemsOnly ? "Show all email →" : "Show problems only →"}
        </Link>
      </div>

      <div className="mt-4">
        {emails.length ? (
          <Table head={["When", "Direction", "Subject", "To / From", "Type", "Status"]}>
            {emails.map(e => (
              <tr key={e.id}>
                <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{when(e.sent_at || e.created_at)}</Td>
                <Td><Pill tone={e.direction === "inbound" ? "good" : "info"}>{e.direction === "inbound" ? "In" : "Out"}</Pill></Td>
                <Td className="text-slate-900 dark:text-white">{e.subject}</Td>
                <Td>{e.direction === "inbound" ? e.from_address : (e.to_addresses || []).join(", ")}</Td>
                <Td className="text-slate-500 dark:text-slate-400">{e.template}</Td>
                <Td><Pill tone={statusTone(e.status)}>{e.status}</Pill></Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>
            {problemsOnly
              ? "No delivery problems recorded. "
              : "No email logged yet. Messages appear here as the site sends them. "}
            Delivery status arrives once the Resend webhook is connected (step 3).
          </Empty>
        )}
      </div>
    </>
  );
}
