"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getThread } from "@/lib/portal";
import { graphConfigured, sendAsSupport } from "@/lib/graph";
import { logEmail } from "@/lib/db";
import { ADMIN_COOKIE, readSession } from "@/lib/portal-auth";
import { withSignature } from "@/lib/signature";

export type ReplyResult = { ok: boolean; message: string };

/**
 * Reply inside a thread, from the support mailbox.
 *
 * Replies to the most recent message that came from the mailbox, so Outlook
 * and the customer's client both keep it in the same conversation instead of
 * starting a new one.
 */
export async function replyInThread(emailId: string, body: string): Promise<ReplyResult> {
  const me = readSession(cookies().get(ADMIN_COOKIE)?.value, "admin");
  if (!me) return { ok: false, message: "Your session has ended. Sign in again." };

  const text = (body || "").trim();
  if (!text) return { ok: false, message: "Write a message first." };
  if (!graphConfigured()) return { ok: false, message: "Microsoft Graph is not configured, so the portal cannot send mail." };

  const thread = await getThread(emailId);
  if (!thread.length) return { ok: false, message: "Could not find that conversation." };

  // Reply to the newest message that exists in the mailbox. Resend-sent mail
  // has no Graph id to reply to.
  const anchor = [...thread].reverse().find(m => m.provider === "graph" && m.provider_id);
  const to =
    [...thread].reverse().find(m => m.direction === "inbound")?.from_address ||
    (thread[thread.length - 1].to_addresses || [])[0];

  if (!to) return { ok: false, message: "No address to reply to on this conversation." };

  const subjectSeed = [...thread].reverse().find(m => m.subject)?.subject || "";
  const subject = subjectSeed
    ? subjectSeed.toLowerCase().startsWith("re:")
      ? subjectSeed
      : `Re: ${subjectSeed}`
    : "Re: your message";

  const full = withSignature(text, me);

  try {
    await sendAsSupport({
      to,
      subject,
      bodyText: full,
      replyToMessageId: anchor?.provider_id || null,
    });
  } catch (e) {
    console.error("[admin] thread reply failed", e);
    return { ok: false, message: `Send failed: ${String(e).slice(0, 200)}` };
  }

  // Logged immediately so the thread shows it without waiting for the next
  // mailbox sync, which runs every fifteen minutes.
  await logEmail({
    direction: "outbound",
    provider: "graph",
    conversationId: thread[0].conversation_id,
    fromAddress: null,
    to: [to],
    subject,
    bodyText: full,
    template: "admin_thread_reply",
    status: "sent",
    scopeLockId: thread.find(m => m.scope_lock_id)?.scope_lock_id || null,
  });

  revalidatePath(`/admin/emails/${emailId}`);
  revalidatePath("/admin/emails");
  return { ok: true, message: `Sent to ${to}.` };
}
