import Link from "next/link";
import { COMPANY } from "@/lib/company";

// Site-wide footer: legal entity, contact, and policy links on every page.
export default function SiteFooter() {
  const link = "hover:text-teal-600 dark:hover:text-teal-400 transition-colors";
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-6 text-xs text-slate-500 dark:text-slate-400">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p>
          © {new Date().getFullYear()} {COMPANY.legalName}. {COMPANY.brand} is a service of {COMPANY.legalName}.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-label="Legal">
          <a href={`mailto:${COMPANY.supportEmail}`} className={link}>{COMPANY.supportEmail}</a>
          <Link href="/privacy" className={link}>Privacy</Link>
          <Link href="/terms" className={link}>Terms</Link>
          <Link href="/refund-policy" className={link}>Refunds</Link>
        </nav>
      </div>
    </footer>
  );
}
