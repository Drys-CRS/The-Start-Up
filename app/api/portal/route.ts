import { NextRequest, NextResponse } from "next/server";
import { getScopeStatus } from "@/lib/monday";
import { getCustomerBundle } from "@/lib/db";
import { STAGE_ORDER, stageMeta } from "@/lib/status";
import { payUrl, signUrl } from "@/lib/links";
import { isDepositPaid } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Data behind the customer portal. Identity rule matches /api/status: the reference
// number and the email on file must both match, and any mismatch returns the same
// generic 404 so neither is enumerable.
//
// Scope is deliberately narrow — the customer's own milestones, payments, and
// requests. Admin notes, the internal timeline and the email log never appear here.

// Stages where the customer still has an agreement to sign.
const SIGNABLE = new Set(["New", "Reviewing", "Scoped & Sent", "Approved"]);

const REQUEST_PREFIX = "Customer requested an update: ";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "portal", 10, 60_000);
  if (limited) return limited;

  const { ref, email } = await req.json().catch(() => ({}));
  if (!ref || !email || typeof ref !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "A reference number and email are required." }, { status: 400 });
  }

  const NOT_FOUND = NextResponse.json(
    { error: "We couldn't find a project matching that reference and email." },
    { status: 404 },
  );

  let record;
  try {
    record = await getScopeStatus(ref.trim());
  } catch {
    return NOT_FOUND;
  }
  if (!record || record.email.trim().toLowerCase() !== email.trim().toLowerCase()) return NOT_FOUND;

  const refNo = record.ref || ref.trim();
  const bundle = await getCustomerBundle(refNo);
  const deal = bundle.deal;
  const stage = record.stageLabel || "";
  const meta = stageMeta(stage);

  // The one thing they can act on right now, if anything.
  let action: { kind: "sign" | "pay"; label: string; url: string } | null = null;
  if (SIGNABLE.has(stage)) {
    action = {
      kind: "sign",
      label: "Review and sign your agreement",
      url: signUrl({
        ref: refNo,
        itemId: record.itemId,
        email: record.email,
        tierLabel: deal?.tier || record.tierLabel || "",
      }),
    };
  } else if (stage === "Signed") {
    action = { kind: "pay", label: "Pay your 10% deposit", url: payUrl({ itemId: record.itemId, email: record.email }) };
  }

  return NextResponse.json({
    ok: true,
    ref: refNo,
    company: deal?.company || record.name || "",
    contact: deal?.contact || "",
    tier: deal?.tier || record.tierLabel || "",
    stage,
    stages: STAGE_ORDER,
    title: meta.title,
    description: meta.description,
    next: meta.next,
    step: meta.step,
    signedBy: deal?.signature_name || null,
    depositPaid: isDepositPaid(stage),
    milestones: {
      submitted: deal?.created_at || null,
      signed: deal?.signed_at || null,
      depositPaid: deal?.deposit_paid_at || null,
      delivered: deal?.delivered_at || null,
    },
    payments: bundle.payments.map(p => ({
      kind: p.kind,
      amountCents: p.amount_cents,
      currency: p.currency || "usd",
      at: p.created_at,
    })),
    requests: bundle.requests.map(r => ({
      at: r.created_at,
      // Stored with an internal prefix for the team's view; strip it for the customer.
      body: (r.body || "").startsWith(REQUEST_PREFIX) ? r.body.slice(REQUEST_PREFIX.length) : r.body,
    })),
    action,
  });
}
