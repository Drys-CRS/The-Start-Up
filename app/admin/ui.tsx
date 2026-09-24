import Link from "next/link";

// Shared presentation pieces for the admin portal. Plain server components: the
// portal is read-only, so none of this needs client-side JavaScript.

export function Card({ label, value, hint, tone = "default" }: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  const valueTone =
    tone === "warn" ? "text-red-600 dark:text-red-400"
    : tone === "good" ? "text-teal-600 dark:text-teal-400"
    : "text-slate-900 dark:text-white";
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full min-w-[640px] border-collapse bg-white dark:bg-slate-900 text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {head.map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2.5 align-top text-slate-700 dark:text-slate-300 ${className}`}>{children ?? "—"}</td>
);

const PILL_TONES: Record<string, string> = {
  good: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  warn: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function Pill({ children, tone = "info" }: { children: React.ReactNode; tone?: "good" | "warn" | "info" }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

// Delivery problems should read as problems at a glance.
export function statusTone(status?: string | null): "good" | "warn" | "info" {
  if (!status) return "info";
  if (["delivered", "opened", "clicked"].includes(status)) return "good";
  if (["failed", "bounced", "complained"].includes(status)) return "warn";
  return "info";
}

export function stageTone(stage?: string | null): "good" | "warn" | "info" {
  if (!stage) return "info";
  if (["Deposit Paid", "Delivered", "In Build", "Build Active", "Planning"].includes(stage)) return "good";
  if (stage === "New") return "warn";
  return "info";
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
      {children}
    </div>
  );
}

export const money = (cents?: number | null, currency = "usd"): string =>
  cents == null ? "—" : `${currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase() + " "}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const usd = (amount?: number | null): string =>
  amount == null ? "—" : `$${Number(amount).toLocaleString("en-US")}`;

export const when = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const day = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const ago = (iso?: string | null): string => {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
};

// Note: the prop is refNo, not ref — React reserves "ref" and it cannot be passed
// to a server component.
export function DealLink({ refNo }: { refNo: string }) {
  return (
    <Link href={`/admin/deals/${encodeURIComponent(refNo)}`} className="font-medium text-teal-600 dark:text-teal-400 hover:underline">
      {refNo}
    </Link>
  );
}

// Shown instead of a page when Supabase credentials are missing in the environment.
export function NotConfigured() {
  return (
    <Empty>
      Supabase isn’t configured for this deployment. Set <code>SUPABASE_URL</code> and{" "}
      <code>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel, then redeploy.
    </Empty>
  );
}
