import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal, portalConfigured } from "@/lib/portal";
import { mondayBoardUrl } from "@/lib/links";
import { SCOPE_BOARD_ID } from "@/lib/monday";
import {
  Empty, NotConfigured, Pill, Section, Table, Td,
  day, money, stageTone, statusTone, usd, when,
} from "../../ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { ref: string } }) {
  return { title: `Deal ${decodeURIComponent(params.ref)}` };
}

const ANSWERS: { label: string; key: "goal" | "bottleneck" | "workflow" | "musthaves" | "integrations" }[] = [
  { label: "Primary goal", key: "goal" },
  { label: "Current bottleneck", key: "bottleneck" },
  { label: "Core workflow", key: "workflow" },
  { label: "Must-have features", key: "musthaves" },
  { label: "Integrations", key: "integrations" },
];

export default async function AdminDeal({ params }: { params: { ref: string } }) {
  if (!portalConfigured()) return <NotConfigured />;

  const refNo = decodeURIComponent(params.ref);
  const detail = await getDeal(refNo);
  if (!detail) notFound();

  const { deal, timeline, emails, payments } = detail;
  const paidCents = payments.reduce((sum, p) => sum + (p.amount_cents || 0), 0);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {deal.company || deal.email}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {deal.ref_no} · submitted {day(deal.created_at)}
            {deal.contact ? ` · ${deal.contact}` : ""} · {deal.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={stageTone(deal.stage)}>{deal.stage}</Pill>
          {deal.unsubscribed_at ? <Pill tone="warn">Unsubscribed</Pill> : null}
          {deal.monday_item_id ? (
            <Link href={mondayBoardUrl(SCOPE_BOARD_ID)} className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              Open in Monday →
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        <Fact label="Tier" value={deal.tier} />
        <Fact label="Signed" value={deal.signed_at ? `${day(deal.signed_at)}${deal.signature_name ? ` by ${deal.signature_name}` : ""}` : "Not signed"} />
        <Fact label="Paid to date" value={payments.length ? money(paidCents) : "—"} />
        <Fact label="Target start" value={deal.start_date ? day(deal.start_date) : "—"} />
      </div>

      <Section title="Their answers">
        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          {ANSWERS.map(a => (
            <div key={a.key}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{a.label}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {deal[a.key] || "—"}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Process">
        {timeline.length ? (
          <ol className="relative space-y-3 border-l border-slate-200 dark:border-slate-700 pl-5">
            {timeline.map(t => (
              <li key={t.id} className="relative">
                <span className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-teal-500" />
                <p className="text-sm text-slate-800 dark:text-slate-200">{t.body}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {when(t.created_at)} · {t.kind}
                  {t.actor ? ` · ${t.actor}` : ""}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <Empty>No timeline entries. Events recorded from now on will appear here.</Empty>
        )}
      </Section>

      <Section title="Email">
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
          <Empty>No email logged against this deal yet.</Empty>
        )}
      </Section>

      <Section title="Payments">
        {payments.length ? (
          <Table head={["When", "Type", "Amount", "Status", "Stripe session"]}>
            {payments.map(p => (
              <tr key={p.id}>
                <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">{when(p.created_at)}</Td>
                <Td><Pill>{p.kind}</Pill></Td>
                <Td className="whitespace-nowrap font-medium text-slate-900 dark:text-white">{money(p.amount_cents, p.currency || "usd")}</Td>
                <Td>{p.status}</Td>
                <Td className="font-mono text-xs text-slate-500 dark:text-slate-400">{p.stripe_session_id}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>No payments recorded against this deal.</Empty>
        )}
      </Section>

      <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
        Monthly tools estimate: {usd(deal.monthly_tools_usd)} · reminder state: {deal.followups || "none"}
      </p>
    </>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-900 dark:text-white">{value || "—"}</p>
    </div>
  );
}
