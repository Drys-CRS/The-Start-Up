import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only mirror of the funnel into Postgres (Supabase), which backs the admin
// portal: submissions, the process timeline, payments, and the email log.
// Monday.com stays the team's board and the source of truth for stage changes.
//
// Every helper here swallows its own errors and returns null on failure. A database
// problem must never break a customer's submission, signature, or payment — the
// portal catching up late is always better than a lost sale.

const URL = process.env.SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let cached: SupabaseClient | null = null;

export const dbConfigured = (): boolean => !!(URL && KEY);

function db(): SupabaseClient | null {
  if (!dbConfigured()) return null;
  if (!cached) cached = createClient(URL, KEY, { auth: { persistSession: false } });
  return cached;
}

function fail(what: string, error: unknown): null {
  console.error(`db: ${what} failed`, error);
  return null;
}

// ── Leads (calculator + homepage tailor) ─────────────────────────────────────

export type LeadInput = {
  kind: "calculator" | "tailor";
  email?: string | null;
  company?: string | null;
  industry?: string | null;
  currency?: string | null;
  monthlyLeads?: number | null;
  avgDealValue?: number | null;
  closeRate?: number | null;
  responseTime?: string | null;
  annualLeak?: number | null;
  source?: string | null;
  mondayItemId?: string | null;
  raw?: unknown;
  // Backfilled rows keep their original Monday timestamp instead of "now".
  createdAt?: string | null;
};

// Each submission is its own row: the same person running the calculator twice is
// two responses, and the portal shows both.
export async function recordLead(input: LeadInput): Promise<string | null> {
  const client = db();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("leads")
      .insert({
        ...(input.createdAt ? { created_at: input.createdAt } : {}),
        kind: input.kind,
        email: input.email || "",
        company: input.company || null,
        industry: input.industry || null,
        currency: input.currency || "USD",
        monthly_leads: input.monthlyLeads ?? null,
        avg_deal_value: input.avgDealValue ?? null,
        close_rate: input.closeRate ?? null,
        response_time: input.responseTime || null,
        annual_leak: input.annualLeak ?? null,
        source: input.source || input.kind,
        monday_item_id: input.mondayItemId || null,
        raw: input.raw ?? null,
      })
      .select("id")
      .single();
    if (error) return fail("recordLead", error);
    return data?.id ?? null;
  } catch (e) {
    return fail("recordLead", e);
  }
}

// ── Scope Locks (Build Plans / deals) ───────────────────────────────────────

export type ScopeLockInput = {
  refNo: string;
  email: string;
  company?: string | null;
  contact?: string | null;
  tier?: string | null;
  currency?: string | null;
  goal?: string | null;
  bottleneck?: string | null;
  workflow?: string | null;
  musthaves?: string | null;
  integrations?: string | null;
  startDate?: string | null;
  stage?: string | null;
  mondayItemId?: string | null;
  raw?: unknown;
  // Backfilled rows keep their original Monday timestamp instead of "now".
  createdAt?: string | null;
};

export async function recordScopeLock(input: ScopeLockInput): Promise<string | null> {
  const client = db();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("scope_locks")
      .upsert(
        {
          ...(input.createdAt ? { created_at: input.createdAt } : {}),
          ref_no: input.refNo,
          email: input.email,
          company: input.company || null,
          contact: input.contact || null,
          tier: input.tier || null,
          currency: input.currency || "USD",
          goal: input.goal || null,
          bottleneck: input.bottleneck || null,
          workflow: input.workflow || null,
          musthaves: input.musthaves || null,
          integrations: input.integrations || null,
          start_date: input.startDate || null,
          stage: input.stage || "New",
          stage_changed_at: new Date().toISOString(),
          monday_item_id: input.mondayItemId || null,
          raw: input.raw ?? null,
        },
        { onConflict: "ref_no" },
      )
      .select("id")
      .single();
    if (error) return fail("recordScopeLock", error);
    return data?.id ?? null;
  } catch (e) {
    return fail("recordScopeLock", e);
  }
}

// Find a deal by whichever identifier the caller has. The Stripe webhook only knows
// the Monday item id; the sign route and status page know the ref.
export async function findScopeLock(by: { mondayItemId?: string | null; refNo?: string | null }) {
  const client = db();
  if (!client) return null;
  try {
    let query = client.from("scope_locks").select("id, ref_no, email, stage, monday_item_id").limit(1);
    if (by.mondayItemId) query = query.eq("monday_item_id", by.mondayItemId);
    else if (by.refNo) query = query.eq("ref_no", by.refNo);
    else return null;
    const { data, error } = await query.maybeSingle();
    if (error) return fail("findScopeLock", error);
    return data;
  } catch (e) {
    return fail("findScopeLock", e);
  }
}

export type ScopeLockPatch = {
  stage?: string;
  signedAt?: string;
  signatureName?: string;
  depositPaidAt?: string;
  deliveredAt?: string;
  followups?: string;
  unsubscribedAt?: string;
  amountUsd?: number;
  monthlyToolsUsd?: number;
};

export async function updateScopeLock(id: string, patch: ScopeLockPatch): Promise<boolean> {
  const client = db();
  if (!client || !id) return false;
  const row: Record<string, unknown> = {};
  if (patch.stage !== undefined) {
    row.stage = patch.stage;
    row.stage_changed_at = new Date().toISOString();
  }
  if (patch.signedAt !== undefined) row.signed_at = patch.signedAt;
  if (patch.signatureName !== undefined) row.signature_name = patch.signatureName;
  if (patch.depositPaidAt !== undefined) row.deposit_paid_at = patch.depositPaidAt;
  if (patch.deliveredAt !== undefined) row.delivered_at = patch.deliveredAt;
  if (patch.followups !== undefined) row.followups = patch.followups;
  if (patch.unsubscribedAt !== undefined) row.unsubscribed_at = patch.unsubscribedAt;
  if (patch.amountUsd !== undefined) row.amount_usd = patch.amountUsd;
  if (patch.monthlyToolsUsd !== undefined) row.monthly_tools_usd = patch.monthlyToolsUsd;
  if (!Object.keys(row).length) return false;
  try {
    const { error } = await client.from("scope_locks").update(row).eq("id", id);
    if (error) return !fail("updateScopeLock", error);
    return true;
  } catch (e) {
    return !fail("updateScopeLock", e);
  }
}

// ── Timeline ────────────────────────────────────────────────────────────────

export type ActivityInput = {
  kind: string; // submitted | emailed | signed | payment | stage_change | follow_up | agent_run | ...
  body: string; // one human-readable line, shown in the portal timeline
  scopeLockId?: string | null;
  leadId?: string | null;
  projectId?: string | null;
  actor?: "system" | "customer" | "admin";
  data?: unknown;
};

export async function logActivity(input: ActivityInput): Promise<string | null> {
  const client = db();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("activity_log")
      .insert({
        kind: input.kind,
        body: input.body,
        scope_lock_id: input.scopeLockId || null,
        lead_id: input.leadId || null,
        project_id: input.projectId || null,
        actor: input.actor || "system",
        data: input.data ?? null,
      })
      .select("id")
      .single();
    if (error) return fail("logActivity", error);
    return data?.id ?? null;
  } catch (e) {
    return fail("logActivity", e);
  }
}

// ── Email log ───────────────────────────────────────────────────────────────

export type EmailInput = {
  direction: "outbound" | "inbound";
  provider?: "resend" | "graph";
  providerId?: string | null;
  messageId?: string | null;
  conversationId?: string | null;
  fromAddress?: string | null;
  to: string[];
  subject?: string | null;
  template?: string | null;
  bodyHtml?: string | null;
  bodyText?: string | null;
  status?: string | null;
  sentAt?: string | null;
  scopeLockId?: string | null;
  leadId?: string | null;
  raw?: unknown;
};

export async function logEmail(input: EmailInput): Promise<string | null> {
  const client = db();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("emails")
      .upsert(
        {
          direction: input.direction,
          provider: input.provider || "resend",
          provider_id: input.providerId || null,
          message_id: input.messageId || null,
          conversation_id: input.conversationId || null,
          from_address: input.fromAddress || null,
          to_addresses: input.to,
          subject: input.subject || null,
          template: input.template || null,
          body_html: input.bodyHtml || null,
          body_text: input.bodyText || null,
          status: input.status || (input.direction === "inbound" ? "received" : "sent"),
          status_at: new Date().toISOString(),
          sent_at: input.sentAt || new Date().toISOString(),
          scope_lock_id: input.scopeLockId || null,
          lead_id: input.leadId || null,
          raw: input.raw ?? null,
        },
        { onConflict: "provider,provider_id", ignoreDuplicates: false },
      )
      .select("id")
      .single();
    if (error) return fail("logEmail", error);
    return data?.id ?? null;
  } catch (e) {
    return fail("logEmail", e);
  }
}

// Delivery outcome from a Resend webhook (delivered, bounced, complained, opened…).
export async function updateEmailStatus(opts: {
  provider?: "resend" | "graph";
  providerId: string;
  status: string;
  statusAt?: string;
  raw?: unknown;
}): Promise<boolean> {
  const client = db();
  if (!client || !opts.providerId) return false;
  try {
    const { error } = await client
      .from("emails")
      .update({
        status: opts.status,
        status_at: opts.statusAt || new Date().toISOString(),
        raw: opts.raw ?? undefined,
      })
      .eq("provider", opts.provider || "resend")
      .eq("provider_id", opts.providerId);
    if (error) return !fail("updateEmailStatus", error);
    return true;
  } catch (e) {
    return !fail("updateEmailStatus", e);
  }
}

// ── Payments ────────────────────────────────────────────────────────────────

export type PaymentInput = {
  stripeSessionId: string;
  kind: string; // deposit | mvp | balance | monthly
  scopeLockId?: string | null;
  mondayItemId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  status?: string | null;
  customerEmail?: string | null;
  raw?: unknown;
};

// ── Backfill (admin, one-off) ───────────────────────────────────────────────

// Has this Monday item already been mirrored? Lets the backfill run repeatedly
// without creating duplicates.
async function alreadyMirrored(table: "leads" | "scope_locks", mondayItemId: string): Promise<boolean> {
  const client = db();
  if (!client || !mondayItemId) return false;
  try {
    const { data } = await client.from(table).select("id").eq("monday_item_id", mondayItemId).limit(1).maybeSingle();
    return !!data?.id;
  } catch {
    return false;
  }
}

export type BackfillResult = "inserted" | "skipped" | "failed";

export async function backfillLead(input: LeadInput): Promise<BackfillResult> {
  if (!input.mondayItemId) return "failed";
  if (await alreadyMirrored("leads", input.mondayItemId)) return "skipped";
  return (await recordLead(input)) ? "inserted" : "failed";
}

export async function backfillScopeLock(input: ScopeLockInput): Promise<BackfillResult> {
  if (!input.mondayItemId) return "failed";
  if (await alreadyMirrored("scope_locks", input.mondayItemId)) return "skipped";
  return (await recordScopeLock(input)) ? "inserted" : "failed";
}

export async function recordPayment(input: PaymentInput): Promise<string | null> {
  const client = db();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("payments")
      .upsert(
        {
          stripe_session_id: input.stripeSessionId,
          kind: input.kind,
          scope_lock_id: input.scopeLockId || null,
          monday_item_id: input.mondayItemId || null,
          amount_cents: input.amountCents ?? null,
          currency: (input.currency || "usd").toLowerCase(),
          status: input.status || "paid",
          customer_email: input.customerEmail || null,
          raw: input.raw ?? null,
        },
        { onConflict: "stripe_session_id" },
      )
      .select("id")
      .single();
    if (error) return fail("recordPayment", error);
    return data?.id ?? null;
  } catch (e) {
    return fail("recordPayment", e);
  }
}
