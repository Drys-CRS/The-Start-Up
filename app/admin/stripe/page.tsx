import { auditStripe } from "@/lib/stripe-admin";
import { priceFor, type TierKey } from "@/lib/pricing";
import { usd } from "@/lib/pricing";
import { Empty, NotConfigured, Pill, Table, Td } from "../ui";
import StripeActions from "./StripeActions";

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

      <Section title="Product descriptions customers can see">
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
