import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getThread, portalConfigured } from "@/lib/portal";
import { NotConfigured, Pill, statusTone, when } from "../../ui";
import { ADMIN_COOKIE, readSession } from "@/lib/portal-auth";
import { signature } from "@/lib/signature";
import ThreadReply from "./ThreadReply";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversation" };

// Outlook on the web can open a message by its Graph id. Only inbound and
// mailbox-sent mail has one: anything Resend sent exists in Resend, not in the
// mailbox, so there is nothing to deep link to.
const outlookLink = (providerId: string | null, provider: string) =>
  provider === "graph" && providerId
    ? `https://outlook.office.com/mail/deeplink/read/${encodeURIComponent(providerId)}`
    : null;

export default async function Conversation({ params }: { params: { id: string } }) {
  if (!portalConfigured()) return <NotConfigured />;

  const thread = await getThread(params.id);
  if (!thread.length) notFound();

  const subject = thread.find(m => m.subject)?.subject || "(no subject)";
  const latest = thread[thread.length - 1];
  // Who to reply to: the other party, which is whoever is not us.
  const counterparty =
    [...thread].reverse().find(m => m.direction === "inbound")?.from_address ||
    (latest.to_addresses || [])[0] ||
    "";

  const me = readSession(cookies().get(ADMIN_COOKIE)?.value, "admin");
  const replyable = thread.some(m => m.provider === "graph" && m.provider_id);

  return (
    <>
      <Link
        href="/admin/emails"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All email
      </Link>

      <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{subject}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {thread.length} message{thread.length === 1 ? "" : "s"}
        {counterparty ? ` with ${counterparty}` : ""}
      </p>

      <div className="mt-5 space-y-3">
        {thread.map(m => {
          const inbound = m.direction === "inbound";
          const link = outlookLink(m.provider_id, m.provider);
          return (
            <article
              key={m.id}
              className={`rounded-xl border p-4 ${
                inbound
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-teal-200 bg-teal-50/60 dark:border-teal-900/60 dark:bg-teal-950/20"
              }`}
            >
              <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Pill tone={inbound ? "good" : "info"}>{inbound ? "In" : "Out"}</Pill>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {inbound ? m.from_address : (m.to_addresses || []).join(", ") || "—"}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{when(m.sent_at || m.created_at)}</span>
                {m.status && <Pill tone={statusTone(m.status)}>{m.status}</Pill>}
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
                  >
                    Open in Outlook <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </header>

              {m.body_text ? (
                <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {m.body_text}
                </pre>
              ) : m.body_html ? (
                // Stored HTML from our own templates. Rendering it would mean
                // trusting mail we did not write, so the text is stripped out
                // instead: this view is for reading, and the Outlook link is
                // there for the real thing.
                <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {m.body_html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
                </pre>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400 dark:text-slate-500">
                  No body stored for this message.
                </p>
              )}
            </article>
          );
        })}
      </div>

      <ThreadReply
        emailId={params.id}
        to={counterparty}
        replyable={replyable}
        signature={signature(me)}
      />
    </>
  );
}
