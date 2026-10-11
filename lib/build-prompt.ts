// The Claude Code prompt for a signed Build Plan, assembled from the scope.
//
// Built in code rather than by asking a model to write it. Three reasons:
// the agent's Gemini path has already gone down once this cycle when the
// credit ran out, a prompt that varies run to run is impossible to review,
// and the stack choice should be ours. We know what we deploy and support;
// a model asked cold will cheerfully suggest something nobody here can
// maintain on day 31.
//
// What the model IS good at is the project-specific middle — the data model
// and the agent logic — and the prompt below tells Claude Code to derive
// those from the scope it is handed.

export type BuildScope = {
  refNo: string;
  company: string | null;
  contact: string | null;
  tier: string | null;
  goal: string | null;
  bottleneck: string | null;
  workflow: string | null;
  musthaves: string | null;
  integrations: string | null;
  startDate: string | null;
  mondayItemId: string | null;
};

type Recommendation = { area: string; choice: string; because: string };

const has = (hay: string, ...needles: string[]) => needles.some(n => hay.includes(n));

/**
 * The stack, decided from what the client actually asked for.
 *
 * Deliberately conservative and repetitive across builds: the thirty-day
 * promise only holds if the team is building on the same ground each time,
 * and the support period after it only holds if they can still read the
 * code. Novelty goes in the product, not the platform.
 */
export function recommendStack(scope: BuildScope): Recommendation[] {
  const text = [scope.goal, scope.bottleneck, scope.workflow, scope.musthaves, scope.integrations]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const recs: Recommendation[] = [
    {
      area: "Framework",
      choice: "Next.js (App Router) in TypeScript, deployed on Vercel",
      because:
        "Server components keep secrets server-side by default, API routes and UI live in one deployable, and preview deployments give the client something to look at from week one.",
    },
    {
      area: "Database",
      choice: "Postgres on Supabase, accessed with the service-role key from server code only",
      because:
        "Relational from the start because pipelines are joins. RLS on with no policies, so the anon key reads nothing and access is a deliberate decision rather than a default.",
    },
    {
      area: "Transactional email",
      choice: "Resend, with every send logged to an emails table",
      because:
        "The log is what makes 'did they get it' answerable. Webhook delivery status closes the loop on bounces.",
    },
  ];

  if (has(text, "pipeline", "crm", "lead", "deal", "sales", "prospect", "follow-up", "followup")) {
    recs.push({
      area: "Pipeline of record",
      choice: "Monday.com via its GraphQL API, mirrored write-through into Postgres",
      because:
        "The team works the board; the mirror is what the product reads. One system to work in, one fast and queryable copy, and the product survives the board being slow or unreachable.",
    });
  }

  if (has(text, "payment", "invoice", "billing", "subscription", "deposit", "checkout", "pay")) {
    recs.push({
      area: "Payments",
      choice: "Stripe Checkout Sessions created server-side, amounts from one pricing module",
      because:
        "Never pre-made Payment Links: their amounts are baked in and drift from what the site advertises. Verify the webhook signature and treat the webhook as the only source of payment truth.",
    });
  }

  if (has(text, "outlook", "microsoft", "office", "exchange", "365", "teams")) {
    recs.push({
      area: "Mailbox and calendar",
      choice: "Microsoft Graph with client-credentials auth and delta queries",
      because: "Delta sync is incremental, so a shared mailbox can be mirrored on a cron without refetching history.",
    });
  } else if (has(text, "gmail", "google workspace", "google calendar")) {
    recs.push({
      area: "Mailbox and calendar",
      choice: "Google Workspace APIs with a service account and domain-wide delegation",
      because: "Same shape as Graph: a service identity the product owns, not an individual's OAuth grant that leaves when they do.",
    });
  }

  if (has(text, "book", "appointment", "schedul", "calendar", "slot", "reservation")) {
    recs.push({
      area: "Scheduling",
      choice: "Cal.com embedded, or a Postgres availability table when the rules are unusual",
      because:
        "Booking looks simple until timezones, buffers and double-booking. Buy it unless the rules are genuinely yours.",
    });
  }

  if (has(text, "document", "pdf", "contract", "proposal", "quote", "invoice", "certificate", "statement")) {
    recs.push({
      area: "Documents",
      choice: "pdf-lib with the standard fonts, generated in a Node route",
      because:
        "No headless browser to keep alive and no file I/O at runtime, which is what makes it work on serverless. Watch the Latin-1 character set.",
    });
  }

  if (has(text, "file", "upload", "image", "attachment", "photo")) {
    recs.push({
      area: "File storage",
      choice: "Vercel Blob, or Supabase Storage when files belong to database rows",
      because: "Never the repo and never the filesystem: serverless instances are not a place to keep anything.",
    });
  }

  if (has(text, "ai", "agent", "score", "summar", "classif", "triage", "enrich", "predict", "draft", "chat")) {
    recs.push({
      area: "AI layer",
      choice:
        "A single lib/ai.ts that returns typed JSON, with a primary model and one fallback provider, called only from server routes",
      because:
        "Providers run out of credit and rate-limit. One cascade in one place means an outage degrades one feature instead of the product, and the key never reaches the browser.",
    });
  }

  if (has(text, "dashboard", "report", "metric", "visib", "forecast", "kpi")) {
    recs.push({
      area: "Reporting",
      choice: "Server components reading Postgres directly, each panel in its own Suspense boundary",
      because:
        "The page streams in as each query lands rather than waiting for the slowest. Keep expensive panels closed until opened, and make closed mean not queried.",
    });
  }

  if (has(text, "login", "account", "portal", "user", "sign in", "auth", "customer access")) {
    recs.push({
      area: "Authentication",
      choice: "One-time links emailed to an address on record, exchanged for a signed httpOnly cookie",
      because:
        "No passwords to leak or reset. Land the link on a page with a button: mail scanners follow links and will spend a single-use token before the human sees it.",
    });
  }

  if (has(text, "sms", "text message", "whatsapp", "mobile reminder", "text reminder")) {
    recs.push({
      area: "SMS and WhatsApp",
      choice: "Twilio, sent from a server route and logged next to the email log",
      because:
        "Messages cost money per send and reach a phone, so the same rule as email applies: log every attempt, and make retries idempotent so nobody is woken twice.",
    });
  }

  recs.push({
    area: "Background work",
    choice: "Vercel Cron hitting authenticated /api/cron/* routes, each safe to run twice",
    because:
      "Crons retry and overlap. Idempotency is the thing that keeps a retry from sending a customer the same email twice.",
  });

  return recs;
}

const bullet = (s: string | null | undefined, fallback: string) => (s && s.trim() ? s.trim() : fallback);

/** The whole prompt, ready to paste into Claude Code. */
export function buildPrompt(scope: BuildScope, board?: { boardId?: string | null; statusColId?: string | null; completedGroupId?: string | null }): string {
  const stack = recommendStack(scope);
  const client = scope.company || "the client";

  const stackTable = stack.map(r => `| ${r.area} | ${r.choice} | ${r.because} |`).join("\n");

  const mondayBlock = board?.boardId
    ? `The build board for this project is Monday.com board \`${board.boardId}\`, status column \`${board.statusColId || "UNKNOWN — look it up before relying on it"}\`, completed group \`${board.completedGroupId || "UNKNOWN — look it up before relying on it"}\`.

After you finish each build step, immediately call the Monday.com API with the \`MONDAY_API_TOKEN\` env var as the Authorization header to set that task's status to Done and move it to the completed group, in that order. Do not batch these until the end: a half-finished build with an accurate board is recoverable, one with a stale board is not.`
    : `No build board has been created for this project yet. Create one first, or ask for the board id before you start, and record task progress against it as you go.`;

  return `# Build: ${client} — ${scope.refNo}

You are building a production system for ${client}. It ships in 30 days and the client's team uses it on day 31, so prefer the boring, supportable option everywhere and leave the clever ones out.

## What they are buying

**Outcome:** ${bullet(scope.goal, "not stated — ask before building")}

**The problem today:** ${bullet(scope.bottleneck, "not stated — ask before building")}

**Core workflow to support:** ${bullet(scope.workflow, "not stated — ask before building")}

**Must have:** ${bullet(scope.musthaves, "not stated — ask before building")}

**Must connect to:** ${bullet(scope.integrations, "nothing specified")}

**Package:** ${scope.tier || "not set"}${scope.startDate ? ` · starts ${scope.startDate}` : ""}

## Stack, and why

Use this stack. It is what we deploy and support, and the support period after delivery depends on the team being able to read it.

| Area | Use | Why |
|---|---|---|
${stackTable}

Deviate only where the scope above makes one of these actively wrong, and say so in your first message if you do.

## Architecture rules

1. **Secrets stay server-side.** No key, token or service credential reaches a client component. Anything \`NEXT_PUBLIC_\` is public, so treat it as published.
2. **One source of truth per fact.** A price, a status label or a fee belongs in exactly one module that every surface reads. Two copies will disagree, and it will be the customer who finds out.
3. **Third parties fail.** Every external call is wrapped, and the product degrades to its own data rather than showing an error page. A board being unreachable must not make a customer's project look like it does not exist.
4. **Webhooks are the payment truth.** Verify the signature, make handling idempotent on the provider's event id, and never mark anything paid from a redirect.
5. **Write-through, not read-through.** When an external system is the place humans work, mirror into Postgres on write and read from the mirror.
6. **Idempotent background jobs.** Anything on a cron must be safe to run twice in the same minute.

## Build order

1. Scaffold the project, environment variables and deploy pipeline. Get an empty page live on day one so the client can see a URL.
2. Data model and migrations for the core workflow.
3. The core workflow end to end, unstyled if necessary, with real data.
4. Integrations from "must connect to", one at a time, each with its failure path.
5. The interface the client's team actually uses daily.
6. The AI layer, if any, last. It is the part that can be cut if the date is at risk.
7. Handover documentation: environment variables, how to run it, how to change the things they will want to change.

## Definition of done

**Core system:** a member of the client's team completes the core workflow on production data without being talked through it.

**AI layer:** each agent runs on a real trigger, writes its result where a human will see it, and has a spend cap and a failure path that leaves the system usable.

## Progress tracking: sync back to Monday.com

${mondayBlock}

## Start here

Read the scope above, then tell me in one message: the data model you intend to create, the routes you will build, and anything in the scope you think is underspecified or will not fit in 30 days. Wait for a reply before scaffolding.`;
}
