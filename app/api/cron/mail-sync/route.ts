import { NextRequest, NextResponse } from "next/server";
import { deltaMessages, graphConfigured, SUPPORT_MAILBOX, type MailFolder } from "@/lib/graph";
import {
  emailExists, findLeadByEmail, findScopeLock, findScopeLockByEmail,
  getMailSyncState, logEmail, setMailSyncState,
} from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

// Pulls the support mailbox into the email log every 15 minutes (see vercel.json),
// covering both directions: Inbox captures customer replies, Sent Items captures
// replies sent from Outlook as well as from the portal.
//
// Authenticated with CRON_SECRET, the same as the follow-ups job.

const FOLDERS: MailFolder[] = ["inbox", "sentitems"];

// Reference numbers appear in our subject lines, which is the most reliable way to
// tie a conversation to a deal. Falls back to matching the other party's address.
const REF_PATTERN = /\b(SL-\d{6,}|LEGACY-\d+)\b/i;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!graphConfigured()) {
    return NextResponse.json(
      { error: "Microsoft Graph is not configured (MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET)" },
      { status: 503 },
    );
  }

  const result: Record<string, { seen: number; stored: number; skipped: number; truncated: boolean }> = {};

  for (const folder of FOLDERS) {
    const state = await getMailSyncState(folder);
    const { messages, deltaLink, nextLink, truncated } = await deltaMessages(folder, state?.delta_link || null);

    let stored = 0;
    let skipped = 0;

    for (const m of messages) {
      if (m.isDraft) { skipped += 1; continue; }
      if (await emailExists("graph", m.id)) { skipped += 1; continue; }

      const direction = folder === "inbox" ? "inbound" : "outbound";
      // Who the customer is on this message: the sender for inbound, the recipient
      // for something we sent.
      const counterparty = (direction === "inbound" ? m.from : m.to[0]) || "";

      let scopeLockId: string | null = null;
      let leadId: string | null = null;

      const ref = (m.subject || "").match(REF_PATTERN);
      if (ref) scopeLockId = (await findScopeLock({ refNo: ref[1] }))?.id || null;
      if (!scopeLockId && counterparty) scopeLockId = (await findScopeLockByEmail(counterparty))?.id || null;
      if (!scopeLockId && counterparty) leadId = (await findLeadByEmail(counterparty))?.id || null;

      await logEmail({
        direction,
        provider: "graph",
        providerId: m.id,
        messageId: m.internetMessageId,
        conversationId: m.conversationId,
        fromAddress: m.from || (direction === "outbound" ? SUPPORT_MAILBOX : null),
        to: m.to,
        subject: m.subject,
        bodyText: m.bodyText,
        template: direction === "outbound" ? "mailbox_reply" : null,
        status: direction === "inbound" ? "received" : "sent",
        sentAt: m.at,
        scopeLockId,
        leadId,
      });
      stored += 1;
    }

    // Finished walk: store the delta link, and the next run gets only what changed.
    // Truncated walk (a big first import): store the nextLink so the following run
    // resumes mid-walk rather than starting over.
    const cursor = truncated ? nextLink : deltaLink;
    if (cursor) await setMailSyncState(folder, cursor);

    result[folder] = { seen: messages.length, stored, skipped, truncated };
  }

  return NextResponse.json({ ok: true, mailbox: SUPPORT_MAILBOX, ...result });
}
