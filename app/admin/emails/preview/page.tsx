import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminLinkHtml, portalLinkHtml, statusHtml } from "@/lib/email";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email design" };

// What customers actually receive.
//
// These call the same html builders the senders call, so the preview cannot
// drift from the real thing: changing a template changes this page. Rendered
// in iframes because an email is a whole document, styles and all, and
// dropping that into the admin page would leak its styles into ours.
const SAMPLES: { name: string; subject: string; note: string; html: string }[] = [
  {
    name: "Portal sign-in link",
    subject: "Your sign-in link",
    note: "The one-time link a customer requests at /status.",
    html: portalLinkHtml({ to: "someone@example.com", token: "example-token", projects: 1 }),
  },
  {
    name: "Admin sign-in link",
    subject: "Your admin sign-in link",
    note: "Same, for the two addresses on the admin allowlist.",
    html: adminLinkHtml({ to: "you@cyberretaliatorsolutions.com", token: "example-token" }),
  },
  {
    name: "Status update",
    subject: "Your build update",
    note: "Sent when a deal changes stage. The teal callout is the next action.",
    html: statusHtml({ stageLabel: "Deposit Paid", ref: "SL-12345678" }),
  },
];

export default function EmailPreview() {
  return (
    <>
      <Link
        href="/admin/emails"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All email
      </Link>

      <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Email design</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Rendered from the same code that sends them, so this is what lands in an inbox. The logo loads from the
        live site, which is also how it will load for the recipient.
      </p>

      <div className="mt-6 space-y-6">
        {SAMPLES.map(s => (
          <section key={s.name}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{s.name}</h2>
              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                Subject: {s.subject}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.note}</p>
            <iframe
              title={s.name}
              srcDoc={s.html}
              className="mt-2 h-[620px] w-full rounded-xl border border-slate-200 bg-white dark:border-slate-700"
              sandbox=""
            />
          </section>
        ))}
      </div>
    </>
  );
}
