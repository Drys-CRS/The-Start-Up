import Link from "next/link";
import { listEmails, portalConfigured } from "@/lib/portal";
import { Empty, NotConfigured, Pill, Table, Td, statusTone, when } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email log" };

type Filter = { direction?: "inbound" | "outbound"; problems?: boolean };

const TABS: { label: string; href: string; match: (f: Filter) => boolean }[] = [
  { label: "All", href: "/admin/emails", match: f => !f.direction && !f.problems },
  { label: "Received", href: "/admin/emails?direction=inbound", match: f => f.direction === "inbound" },
  { label: "Sent", href: "/admin/emails?direction=outbound", match: f => f.direction === "outbound" },
  { label: "Problems", href: "/admin/emails?problems=1", match: f => !!f.problems },
];

export default async function AdminEmails({
  searchParams,
}: {
  searchParams: { problems?: string; direction?: string };
}) {
  if (!portalConfigured()) return <NotConfigured />;

  const direction =
    searchParams?.direction === "inbound" || searchParams?.direction === "outbound"
      ? searchParams.direction
      : undefined;
  const problemsOnly = searchParams?.problems === "1";
  const filter: Filter = { direction, problems: problemsOnly };

  const emails = await listEmails({ problemsOnly, direction });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1" aria-label="Filter email">
          {TABS.map(t => {
            const on = t.match(filter);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <p className="text-sm text-slate-500 dark:text-slate-400">{emails.length} shown</p>
      </div>

      <div className="mt-4">
        {emails.length ? (
          <Table head={["When", "Direction", "Subject", "To / From", "Type", "Status"]}>
            {emails.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{when(e.sent_at || e.created_at)}</Td>
                <Td><Pill tone={e.direction === "inbound" ? "good" : "info"}>{e.direction === "inbound" ? "In" : "Out"}</Pill></Td>
                <Td className="text-slate-900 dark:text-white">
                  {/* The whole row would be nicer, but a link inside a table
                      cell is the version that works with a keyboard. */}
                  <Link href={`/admin/emails/${e.id}`} className="hover:text-teal-600 hover:underline dark:hover:text-teal-400">
                    {e.subject || "(no subject)"}
                  </Link>
                </Td>
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
              : direction === "inbound"
                ? "Nothing received yet. Inbound mail arrives from the mailbox sync, which runs every fifteen minutes. "
                : direction === "outbound"
                  ? "Nothing sent yet. "
                  : "No email logged yet. Messages appear here as the site sends them. "}
          </Empty>
        )}
      </div>
    </>
  );
}
