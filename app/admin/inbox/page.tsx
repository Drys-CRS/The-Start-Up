import Link from "next/link";
import { listInbox, portalConfigured } from "@/lib/portal";
import { DealLink, Empty, NotConfigured, Pill, Table, Td, when } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox" };

// Customer replies that still need an answer. Answered means something went out in
// the same Outlook conversation afterwards, so replies sent from Outlook count too.
export default async function AdminInbox({
  searchParams,
}: {
  searchParams: { all?: string; vendors?: string };
}) {
  if (!portalConfigured()) return <NotConfigured />;

  const unansweredOnly = searchParams?.all !== "1";
  const hideUnmatched = searchParams?.vendors !== "1";
  const rows = await listInbox({ unansweredOnly, hideUnmatched });

  const toggle = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (params.all) q.set("all", params.all);
    if (params.vendors) q.set("vendors", params.vendors);
    const s = q.toString();
    return `/admin/inbox${s ? `?${s}` : ""}`;
  };
  const linkClass = "text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline";

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {unansweredOnly ? "Replies waiting for an answer" : "All inbound email"}
          {hideUnmatched ? ", from leads and customers only" : ", including vendor mail"}. {rows.length} shown.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href={toggle({ all: unansweredOnly ? "1" : undefined, vendors: hideUnmatched ? undefined : "1" })} className={linkClass}>
            {unansweredOnly ? "Show answered too →" : "Waiting only →"}
          </Link>
          <Link href={toggle({ all: unansweredOnly ? undefined : "1", vendors: hideUnmatched ? "1" : undefined })} className={linkClass}>
            {hideUnmatched ? "Include vendor mail →" : "Hide vendor mail →"}
          </Link>
        </div>
      </div>

      <div className="mt-4">
        {rows.length ? (
          <Table head={["Arrived", "From", "Subject", "Message", "Deal", "State"]}>
            {rows.map(r => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{when(r.at)}</Td>
                <Td>{r.from}</Td>
                <Td className="text-slate-900 dark:text-white">{r.subject}</Td>
                <Td className="max-w-md text-slate-500 dark:text-slate-400">{r.preview || "—"}</Td>
                <Td className="whitespace-nowrap">
                  {r.dealRef ? <DealLink refNo={r.dealRef} /> : r.matched ? "lead" : <Pill>Unmatched</Pill>}
                </Td>
                <Td>{r.replied ? <Pill tone="good">Answered</Pill> : <Pill tone="warn">Waiting</Pill>}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>
            {unansweredOnly
              ? "Nothing waiting for a reply."
              : "No inbound email recorded yet."}{" "}
            The support mailbox syncs every 15 minutes. Reply to a customer from their deal page.
          </Empty>
        )}
      </div>
    </>
  );
}
