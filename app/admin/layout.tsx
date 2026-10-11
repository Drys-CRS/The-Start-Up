import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { ADMIN_COOKIE, readSession } from "@/lib/portal-auth";
import AdminSignOut from "./AdminSignOut";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/emails", label: "Email" },
  { href: "/admin/mvp-agent", label: "MVP agent" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // The sign-in pages live under /admin so the middleware can treat the whole
  // prefix as one thing, but they must not render the signed-in chrome. The
  // middleware forwards the path for exactly this.
  const pathname = headers().get("x-pathname") || "";
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/enter")) {
    return <>{children}</>;
  }

  const who = readSession(cookies().get(ADMIN_COOKIE)?.value, "admin");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Link href="/admin" className="text-sm font-bold tracking-tight">
            The Start Up <span className="text-teal-600 dark:text-teal-400">admin</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="Admin">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {who && <span className="hidden sm:inline font-mono text-[11px] text-slate-400 dark:text-slate-500">{who}</span>}
            <AdminSignOut />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
    </div>
  );
}
