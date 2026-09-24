import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { logActivity, updateEmailStatus } from "@/lib/db";

export const runtime = "nodejs";

// Delivery outcomes from Resend: delivered, bounced, complained, opened, clicked.
// Signature-verified with RESEND_WEBHOOK_SECRET — without it this refuses every
// request, since an unverified endpoint here could rewrite the email log.
//
// Events are matched to a stored message by Resend's email id, so replays are
// harmless. Resend retries on non-200s, and delivers at least once.

const STATUS: Record<string, string> = {
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.failed": "failed",
};

// Worth surfacing on the deal's timeline: the customer never got the email.
const PROBLEMS = new Set(["bounced", "complained", "failed"]);

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!secret || !apiKey) {
    return NextResponse.json({ error: "Resend webhook is not configured" }, { status: 503 });
  }

  const payload = await req.text();

  // Standard-webhooks signature headers. Resend sends them as svix-*; webhook-* is
  // the vendor-neutral alias for the same values.
  const header = (name: string) => req.headers.get(`svix-${name}`) || req.headers.get(`webhook-${name}`) || "";
  const headers = { id: header("id"), timestamp: header("timestamp"), signature: header("signature") };
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }

  let event: any;
  try {
    event = new Resend(apiKey).webhooks.verify({ payload, headers, webhookSecret: secret });
  } catch (e) {
    console.error("Resend webhook signature rejected", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const status = STATUS[event?.type];
  const emailId = event?.data?.email_id || event?.data?.id || null;
  // Unknown or uninteresting event types are acknowledged so Resend stops retrying.
  if (!status || !emailId) return NextResponse.json({ received: true, ignored: event?.type || "unknown" });

  const row = await updateEmailStatus({
    provider: "resend",
    providerId: String(emailId),
    status,
    statusAt: event?.created_at || undefined,
    raw: event,
  });

  if (row && PROBLEMS.has(status)) {
    await logActivity({
      kind: "email_problem",
      scopeLockId: row.scope_lock_id,
      leadId: row.lead_id,
      body: `Email ${status}: ${row.subject || "(no subject)"}`,
      data: { to: row.to_addresses, type: event?.type },
    });
  }

  return NextResponse.json({ received: true, matched: !!row, status });
}
