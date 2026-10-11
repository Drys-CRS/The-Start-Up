import { NextRequest, NextResponse } from "next/server";
import { getScopeStatus } from "@/lib/monday";
import { getCustomerBundle, listDealsForEmail } from "@/lib/db";
import { STAGE_ORDER, stageMeta } from "@/lib/status";
import { payUrl, signUrl } from "@/lib/links";
import { isDepositPaid } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { PORTAL_COOKIE, readSession } from "@/lib/portal-auth";

export const runtime = "nodejs";

// Data behind the customer portal.
//
// Identity now comes from the session cookie, which only exists because
// somebody clicked a one-time link we emailed to that address. The reference
// number is no longer a credential: it is used to pick which of your projects
// to show, and it is checked against the deals your address actually owns.
// Passing someone else's reference gets you nothing.
//
// Scope is deliberately narrow — the customer's own milestones, payments, and
// requests. Admin notes, the internal timeline and the email log never appear here.

// Stages where the customer still has an agreement to sign.
const SIGNABLE = new Set(["New", "Reviewing", "Scoped & Sent", "Approved"]);

const REQUEST_PREFIX = "Customer requested an update: ";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "portal", 20, 60_000);
  if (limited) return limited;

  const email = readSession(req.cookies.get(PORTAL_COOKIE)?.value);
  if (!email) {
    return NextResponse.json({ error: "Your session has ended. Request a new sign-in link." }, { status: 401 });
  }

  const deals = await listDealsForEmail(email);
  if (deals.length === 0) {
    return NextResponse.json({ error: "There are no projects on this address." }, { status: 404 });
  }

  // Which project. Only ever one this address owns.
  const { ref: wanted } = await req.json().catch(() => ({}));
  const chosen =
    (typeof wanted === "string" && deals.find(d => d.ref_no === wanted.trim())) || deals[0];

  const NOT_FOUND = NextResponse.json({ error: "We could not load that project." }, { status: 404 });

  // Monday holds the live stage, but it is a third party on the critical path
  // of a page the customer opens to find out what is happening. When it is
  // slow, down, or simply does not have this reference (backfilled deals were
  // written to Postgres before Monday knew their reference), the portal falls
  // back to our own row rather than telling someone their project does not
  // exist.
  let record: Awaited<ReturnType<typeof getScopeStatus>> | null = null;
  try {
    record = await getScopeStatus(chosen.ref_no);
  } catch {
    record = null;
  }

  const refNo = record?.ref || chosen.ref_no;
  const bundle = await getCustomerBundle(refNo);
  const deal = bundle.deal;
  if (!record && !deal) return NOT_FOUND;

  const stage = record?.stageLabel || deal?.stage || "";
  const meta = stageMeta(stage);

  // The one thing they can act on right now, if anything.
  let action: { kind: "sign" | "pay"; label: string; url: string } | null = null;
  if (SIGNABLE.has(stage)) {
    action = {
      kind: "sign",
      label: "Review and sign your agreement",
      url: signUrl({
        ref: refNo,
        itemId: record?.itemId || deal?.monday_item_id || "",
        email: record?.email || deal?.email || email,
        tierLabel: deal?.tier || record?.tierLabel || "",
      }),
    };
  } else if (stage === "Signed") {
    action = {
      kind: "pay",
      label: "Pay your deposit",
      url: payUrl({ itemId: record?.itemId || deal?.monday_item_id || "", email: record?.email || deal?.email || email }),
    };
  }

  return NextResponse.json({
    ok: true,
    signedInAs: email,
    projects: deals.map(d => ({ ref: d.ref_no, company: d.company || "", stage: d.stage || "" })),
    ref: refNo,
    company: deal?.company || record?.name || "",
    contact: deal?.contact || "",
    tier: deal?.tier || record?.tierLabel || "",
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
