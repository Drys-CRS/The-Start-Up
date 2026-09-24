"use server";

import { revalidatePath } from "next/cache";
import { findScopeLock, latestMailboxMessage, logActivity, updateScopeLock } from "@/lib/db";
import { sendAsSupport, graphConfigured, SUPPORT_MAILBOX } from "@/lib/graph";
import { sendBuildPlanConfirmation } from "@/lib/email";
import { signUrl } from "@/lib/links";
import { SCOPE, SCOPE_BOARD_ID, setSimpleColumn } from "@/lib/monday";

// Actions available from a deal page. These run server-side inside /admin, which
// middleware.ts protects with the admin password, so the browser's credentials cover
// them the same as a page load.
//
// Each returns a short message for the UI rather than throwing, and records what
// happened on the deal's timeline with actor "admin".

export type ActionResult = { ok: boolean; message: string };

const refresh = (refNo: string) => revalidatePath(`/admin/deals/${encodeURIComponent(refNo)}`);

async function dealFor(refNo: string) {
  const deal = await findScopeLock({ refNo });
  return deal && deal.id ? deal : null;
}

// Reply to the customer as support@, threaded into the existing conversation when we
// have one. The sent copy lands in Sent Items, so the next mailbox sync files it in
// the email log; the timeline records it immediately.
export async function replyToCustomer(refNo: string, body: string): Promise<ActionResult> {
  const text = (body || "").trim();
  if (!text) return { ok: false, message: "Write a message first." };
  if (!graphConfigured()) return { ok: false, message: "Microsoft Graph isn't configured, so the portal can't send mail." };

  const deal = await dealFor(refNo);
  if (!deal) return { ok: false, message: "Couldn't find that deal." };
  if (!deal.email) return { ok: false, message: "This deal has no email address on file." };

  const last = await latestMailboxMessage(deal.id);
  const subject = last?.subject
    ? last.subject.toLowerCase().startsWith("re:") ? last.subject : `Re: ${last.subject}`
    : `Your build — ${deal.ref_no}`;

  try {
    await sendAsSupport({
      to: deal.email,
      subject,
      bodyText: text,
      replyToMessageId: last?.provider_id || null,
    });
  } catch (e) {
    console.error("portal reply failed", e);
    return { ok: false, message: `Send failed: ${String(e).slice(0, 200)}` };
  }

  await logActivity({
    kind: "email_out",
    scopeLockId: deal.id,
    actor: "admin",
    body: `Replied from the portal: ${subject}`,
    data: { to: deal.email, from: SUPPORT_MAILBOX, preview: text.slice(0, 200) },
  });
  refresh(refNo);
  return { ok: true, message: `Sent to ${deal.email}. It appears in the thread after the next mailbox sync.` };
}

// Move a deal's stage. Monday stays the source of truth, so it is written first and
// only mirrored locally if that succeeded.
export async function changeStage(refNo: string, stage: string): Promise<ActionResult> {
  const label = (stage || "").trim();
  if (!label) return { ok: false, message: "Pick a stage." };

  const deal = await dealFor(refNo);
  if (!deal) return { ok: false, message: "Couldn't find that deal." };
  if (!deal.monday_item_id) return { ok: false, message: "This deal has no Monday item, so its stage can't be changed here." };

  try {
    await setSimpleColumn(SCOPE_BOARD_ID, deal.monday_item_id, SCOPE.stage, label);
  } catch (e) {
    console.error("stage change failed", e);
    return { ok: false, message: `Monday rejected the change: ${String(e).slice(0, 200)}` };
  }

  await updateScopeLock(deal.id, { stage: label });
  await logActivity({
    kind: "stage_change",
    scopeLockId: deal.id,
    actor: "admin",
    body: `Stage changed to ${label}`,
    data: { stage: label },
  });
  refresh(refNo);
  return { ok: true, message: `Stage is now ${label}.` };
}

// Re-send the Build Plan confirmation, with a fresh signing link.
export async function resendConfirmation(refNo: string): Promise<ActionResult> {
  const deal = await dealFor(refNo);
  if (!deal) return { ok: false, message: "Couldn't find that deal." };
  if (!deal.email) return { ok: false, message: "This deal has no email address on file." };

  const sent = await sendBuildPlanConfirmation({
    to: deal.email,
    company: "",
    ref: deal.ref_no,
    signUrl: signUrl({ ref: deal.ref_no, itemId: deal.monday_item_id || "", email: deal.email, tierLabel: "" }),
  });

  await logActivity({
    kind: "emailed",
    scopeLockId: deal.id,
    actor: "admin",
    body: sent ? "Confirmation email re-sent with the signing link" : "Tried to re-send the confirmation email, but it failed",
    data: { to: deal.email, sent },
  });
  refresh(refNo);
  return sent
    ? { ok: true, message: `Confirmation re-sent to ${deal.email}.` }
    : { ok: false, message: "Resend didn't accept the email — check the email log." };
}

// A private note, visible only in the portal timeline.
export async function addNote(refNo: string, note: string): Promise<ActionResult> {
  const text = (note || "").trim();
  if (!text) return { ok: false, message: "Write something first." };

  const deal = await dealFor(refNo);
  if (!deal) return { ok: false, message: "Couldn't find that deal." };

  await logActivity({
    kind: "note",
    scopeLockId: deal.id,
    actor: "admin",
    body: text.slice(0, 1000),
  });
  refresh(refNo);
  return { ok: true, message: "Note added." };
}
