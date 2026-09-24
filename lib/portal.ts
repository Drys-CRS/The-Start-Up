import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Read queries behind the admin portal. Separate from lib/db.ts (which is the
// write-through path used by the funnel) because these run at request time inside
// server components and are allowed to throw: an admin page showing an error is
// fine, whereas a customer submission failing is not.

const URL = process.env.SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let cached: SupabaseClient | null = null;

export const portalConfigured = (): boolean => !!(URL && KEY);

function client(): SupabaseClient {
  if (!portalConfigured()) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  if (!cached) cached = createClient(URL, KEY, { auth: { persistSession: false } });
  return cached;
}

const sinceDays = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

async function countRows(table: string, build: (q: any) => any): Promise<number> {
  const q = build(client().from(table).select("*", { count: "exact", head: true }));
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export type Dashboard = {
  leads7: number;
  leads30: number;
  plans7: number;
  plans30: number;
  signed30: number;
  paid30: number;
  revenue30Cents: number;
  emailFailures7: number;
  inboundTotal: number;
  byStage: { stage: string; count: number }[];
  recent: ActivityRow[];
};

export type ActivityRow = {
  id: string;
  created_at: string;
  kind: string;
  body: string;
  actor: string | null;
  scope_lock_id: string | null;
  lead_id: string | null;
};

export async function getDashboard(): Promise<Dashboard> {
  const d7 = sinceDays(7);
  const d30 = sinceDays(30);

  const [leads7, leads30, plans7, plans30, signed30, emailFailures7, inboundTotal] = await Promise.all([
    countRows("leads", q => q.gte("created_at", d7)),
    countRows("leads", q => q.gte("created_at", d30)),
    countRows("scope_locks", q => q.gte("created_at", d7)),
    countRows("scope_locks", q => q.gte("created_at", d30)),
    countRows("scope_locks", q => q.gte("signed_at", d30)),
    countRows("emails", q => q.gte("created_at", d7).in("status", ["failed", "bounced", "complained"])),
    countRows("emails", q => q.eq("direction", "inbound")),
  ]);

  const { data: paymentRows, error: payErr } = await client()
    .from("payments")
    .select("amount_cents")
    .gte("created_at", d30);
  if (payErr) throw payErr;

  const { data: stageRows, error: stageErr } = await client().from("scope_locks").select("stage");
  if (stageErr) throw stageErr;

  const tally = new Map<string, number>();
  for (const row of stageRows || []) {
    const stage = (row as any).stage || "Unknown";
    tally.set(stage, (tally.get(stage) || 0) + 1);
  }

  const { data: recent, error: recentErr } = await client()
    .from("activity_log")
    .select("id, created_at, kind, body, actor, scope_lock_id, lead_id")
    .order("created_at", { ascending: false })
    .limit(15);
  if (recentErr) throw recentErr;

  return {
    leads7,
    leads30,
    plans7,
    plans30,
    signed30,
    paid30: (paymentRows || []).length,
    revenue30Cents: (paymentRows || []).reduce((sum, r: any) => sum + (r.amount_cents || 0), 0),
    emailFailures7,
    inboundTotal,
    byStage: [...tally.entries()].map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count),
    recent: (recent || []) as unknown as ActivityRow[],
  };
}

// ── Leads ───────────────────────────────────────────────────────────────────

export type LeadRow = {
  id: string;
  created_at: string;
  kind: string;
  company: string | null;
  email: string;
  industry: string | null;
  annual_leak: number | null;
  currency: string | null;
  source: string | null;
  followups: string | null;
  unsubscribed_at: string | null;
  monday_item_id: string | null;
};

export async function listLeads(limit = 200): Promise<LeadRow[]> {
  const { data, error } = await client()
    .from("leads")
    .select("id, created_at, kind, company, email, industry, annual_leak, currency, source, followups, unsubscribed_at, monday_item_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as LeadRow[];
}

// ── Deals ───────────────────────────────────────────────────────────────────

export type DealRow = {
  id: string;
  created_at: string;
  ref_no: string;
  company: string | null;
  contact: string | null;
  email: string;
  tier: string | null;
  stage: string;
  stage_changed_at: string | null;
  signed_at: string | null;
  signature_name: string | null;
  deposit_paid_at: string | null;
  delivered_at: string | null;
  amount_usd: number | null;
  monthly_tools_usd: number | null;
  followups: string | null;
  unsubscribed_at: string | null;
  monday_item_id: string | null;
  goal: string | null;
  bottleneck: string | null;
  workflow: string | null;
  musthaves: string | null;
  integrations: string | null;
  start_date: string | null;
};

const DEAL_FIELDS =
  "id, created_at, ref_no, company, contact, email, tier, stage, stage_changed_at, signed_at, signature_name, " +
  "deposit_paid_at, delivered_at, amount_usd, monthly_tools_usd, followups, unsubscribed_at, monday_item_id, " +
  "goal, bottleneck, workflow, musthaves, integrations, start_date";

export async function listDeals(limit = 200): Promise<DealRow[]> {
  const { data, error } = await client()
    .from("scope_locks")
    .select(DEAL_FIELDS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DealRow[];
}

export type EmailRow = {
  id: string;
  created_at: string;
  sent_at: string | null;
  direction: string;
  provider: string;
  from_address: string | null;
  to_addresses: string[] | null;
  subject: string | null;
  template: string | null;
  status: string | null;
  status_at: string | null;
  conversation_id: string | null;
  scope_lock_id: string | null;
};

export type PaymentRow = {
  id: string;
  created_at: string;
  kind: string;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  customer_email: string | null;
  stripe_session_id: string | null;
};

export type DealDetail = {
  deal: DealRow;
  timeline: ActivityRow[];
  emails: EmailRow[];
  payments: PaymentRow[];
};

const EMAIL_FIELDS =
  "id, created_at, sent_at, direction, provider, from_address, to_addresses, subject, template, status, status_at, conversation_id, scope_lock_id";

export async function getDeal(refNo: string): Promise<DealDetail | null> {
  const { data: deal, error } = await client().from("scope_locks").select(DEAL_FIELDS).eq("ref_no", refNo).maybeSingle();
  if (error) throw error;
  if (!deal) return null;

  const dealId = (deal as any).id as string;
  const [timeline, emails, payments] = await Promise.all([
    client()
      .from("activity_log")
      .select("id, created_at, kind, body, actor, scope_lock_id, lead_id")
      .eq("scope_lock_id", dealId)
      .order("created_at", { ascending: false }),
    client().from("emails").select(EMAIL_FIELDS).eq("scope_lock_id", dealId).order("created_at", { ascending: false }),
    client()
      .from("payments")
      .select("id, created_at, kind, amount_cents, currency, status, customer_email, stripe_session_id")
      .eq("scope_lock_id", dealId)
      .order("created_at", { ascending: false }),
  ]);
  if (timeline.error) throw timeline.error;
  if (emails.error) throw emails.error;
  if (payments.error) throw payments.error;

  return {
    deal: deal as unknown as DealRow,
    timeline: (timeline.data || []) as unknown as ActivityRow[],
    emails: (emails.data || []) as unknown as EmailRow[],
    payments: (payments.data || []) as unknown as PaymentRow[],
  };
}

// ── Email log ───────────────────────────────────────────────────────────────

export async function listEmails(opts: { limit?: number; problemsOnly?: boolean } = {}): Promise<EmailRow[]> {
  let query = client()
    .from("emails")
    .select(EMAIL_FIELDS)
    .order("created_at", { ascending: false })
    .limit(opts.limit || 200);
  if (opts.problemsOnly) query = query.in("status", ["failed", "bounced", "complained"]);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as EmailRow[];
}
