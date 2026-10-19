import { auditStripe, WEBHOOK_PATH } from "@/lib/stripe-admin";
import { priceFor, type TierKey } from "@/lib/pricing";
import { usd } from "@/lib/pricing";
import { Empty, NotConfigured, Pill, Table, Td } from "../ui";
import StripeActions from "./StripeActions";
import DescriptionFixer from "./DescriptionFixer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stripe" };

// Card in ../ui is a stat tile. This page wants section panels.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

const TIERS: TierKey[] = ["promo", "premium", "advanced"];

export default async function AdminStripe() {
  const audit = await auditStripe();
  if (!audit.configured) return <NotConfigured />;

  return (
    <>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        What the site quotes, and what is left over in the Stripe account.
      </p>

      <Section title="What checkout charges today">
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Built from lib/pricing when the customer clicks, so this is both the advertised price and the charged
          price. Nothing here is a Stripe object that can drift.
        </p>
        <Table head={["Tier", "Total", "Schedule", "Discount"]}>
          {TIERS.map(t => {
            const p = priceFor(t);
            return (
              <tr key={t}>
                <Td className="text-slate-900 dark:text-white">{p.name}</Td>
                <Td className="font-mono">{usd(p.total)}</Td>
                <Td className="font-mono text-slate-500 dark:text-slate-400">
                  {p.schedule.map(m => usd(m.amount)).join(" + ")}
                </Td>
                <Td>{p.early ? <Pill tone="good">$500 off</Pill> : <Pill>full rate</Pill>}</Td>
              </tr>
            );
          })}
        </Table>
      </Section>

      <Section title="What Stripe holds as your business identity">
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          This is the address and number already printing on your Stripe receipts and invoices. Copy it into
          lib/company and the site footer, the legal pages, the agreement and the email sign-off will all say the
          same thing. If it is wrong or still South African, fix it in Stripe first: it reaches customers either
          way.
        </p>
        {audit.identity ? (
          <dl className="space-y-1.5 text-sm">
            {([
              ["Account name", audit.identity.name],
              ["Country", audit.identity.country],
              ["Default currency", audit.identity.defaultCurrency],
              ["Registered address", audit.identity.addressLines.join(", ") || null],
              ["Support phone", audit.identity.supportPhone],
              ["Support email", audit.identity.supportEmail],
            ] as [string, string | null][]).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:w-40 sm:pt-1">
                  {k}
                </dt>
                <dd className={v ? "text-slate-800 dark:text-slate-100" : "italic text-slate-400 dark:text-slate-500"}>
                  {v || "not set in Stripe"}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <Empty>Stripe did not return account details.</Empty>
        )}
      </Section>

      <Section title="Webhook endpoints">
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Stripe tells us a payment happened by calling one of these. A webhook on the wrong path fails quietly
          until Stripe emails to say it is giving up, and the payment never gets recorded. The handler lives at{" "}
          <span className="font-mono">{WEBHOOK_PATH}</span>, on any of our domains.
        </p>
        {audit.webhooks?.length ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {audit.webhooks.map(w => (
              <li key={w.id} className="py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={w.problem ? "warn" : "good"}>{w.problem ? "Check this" : "OK"}</Pill>
                  <span className="break-all font-mono text-xs text-slate-700 dark:text-slate-200">{w.url}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{w.events} events</span>
                </div>
                {w.problem && (
                  <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400">{w.problem}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>
            No webhook endpoints on this account. Without one, a completed payment is never recorded against the
            deal.
          </Empty>
        )}
      </Section>

      <Section title="Currencies on active prices">
        {Object.keys(audit.currencies).length ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(audit.currencies).map(([cur, n]) => (
              <Pill key={cur} tone={cur === "usd" ? "good" : "warn"}>
                {cur.toUpperCase()}: {n}
              </Pill>
            ))}
          </div>
        ) : (
          <Empty>No active prices.</Empty>
        )}
      </Section>

      {audit.error && (
        <Section title="Stripe returned an error">
          <p className="font-mono text-xs text-rose-600 dark:text-rose-400">{audit.error}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            The list below may be incomplete.
          </p>
        </Section>
      )}

      <Section title="Stale items">
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Archiving hides these from new checkouts. It is reversible and does not touch historic payments. Payment
          Links are listed but not ticked by default: one may still be sitting in a customer&apos;s inbox.
        </p>
        <StripeActions items={audit.stale} />
      </Section>

      <Section title="Descriptions quoting Rand or a dead date">
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          These show on the Stripe-hosted checkout page and on receipts, which makes them the only ZAR a customer
          can still actually see. The replacement is written from lib/pricing, so it says what the site says. Edit
          before saving if you want different wording.
        </p>
        <DescriptionFixer
          products={audit.keptProducts.map(p => ({
            ...p,
            suggestion: `${priceFor("promo").name} build. ${usd(priceFor("promo").total)} all in, paid ${priceFor("promo")
              .schedule.map(m => usd(m.amount))
              .join(" then ")}. 30-day build with 60 days of support included.`,
          }))}
        />
      </Section>

      <Section title="All product descriptions">
        {audit.keptProducts.length ? (
          <Table head={["Product", "Description"]}>
            {audit.keptProducts.map(p => {
              const bad = /\bR\s?\d|\bZAR\b|rand|30 sep/i.test(p.description || "");
              return (
                <tr key={p.id}>
                  <Td className="text-slate-900 dark:text-white">{p.name}</Td>
                  <Td className={bad ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}>
                    {p.description || "—"}
                    {bad && <span className="ml-2 font-semibold">needs rewriting</span>}
                  </Td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty>No active products.</Empty>
        )}
      </Section>
    </>
  );
}
