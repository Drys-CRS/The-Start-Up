// Microsoft Graph access to the support mailbox (Exchange Online).
//
// App-only auth via the client-credentials flow: an Entra app registration holding
// Mail.Read (and Mail.Send for replies sent from the portal), narrowed to this one
// mailbox by an Exchange Application Access Policy.
//
// Reading is incremental. Graph's delta query is per folder, so Inbox and Sent Items
// are tracked separately: each run returns only what changed and a fresh deltaLink,
// which we store in public.mail_sync_state for next time.

const TENANT = process.env.MS_TENANT_ID || "";
const CLIENT_ID = process.env.MS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET || "";

export const SUPPORT_MAILBOX = process.env.SUPPORT_MAILBOX || "support@tsu.agency";

export const graphConfigured = (): boolean => !!(TENANT && CLIENT_ID && CLIENT_SECRET);

export type MailFolder = "inbox" | "sentitems";

// Bodies are stored for the portal thread view; cap them so one giant email can't
// bloat a row (the full message always remains in Exchange).
const MAX_BODY_CHARS = 20_000;

const SELECT = "id,conversationId,internetMessageId,subject,from,toRecipients,receivedDateTime,sentDateTime,body,isDraft";

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const res = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Graph token request failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }
  token = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return token.value;
}

async function graphFetch(url: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      // Plain-text bodies keep stored messages readable and small.
      Prefer: 'outlook.body-content-type="text"',
      ...(init.headers || {}),
    },
  });
  if (res.status === 204) return {};
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Graph ${init.method || "GET"} failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

export type GraphMessage = {
  id: string;
  conversationId: string | null;
  internetMessageId: string | null;
  subject: string | null;
  from: string | null;
  to: string[];
  at: string | null;
  bodyText: string | null;
  isDraft: boolean;
};

function normalise(m: any): GraphMessage {
  const body = typeof m?.body?.content === "string" ? m.body.content.slice(0, MAX_BODY_CHARS) : null;
  return {
    id: String(m.id),
    conversationId: m.conversationId || null,
    internetMessageId: m.internetMessageId || null,
    subject: m.subject || null,
    from: m?.from?.emailAddress?.address || null,
    to: (m.toRecipients || []).map((r: any) => r?.emailAddress?.address).filter(Boolean),
    at: m.receivedDateTime || m.sentDateTime || null,
    bodyText: body,
    isDraft: !!m.isDraft,
  };
}

// Incremental read of one folder. Pass the stored deltaLink to get only what changed;
// pass null for a first run, which walks the folder's current contents.
// A run that hits maxPages returns its nextLink: storing that resumes the walk where
// it stopped, so a large mailbox imports across several runs instead of restarting.
export async function deltaMessages(
  folder: MailFolder,
  deltaLink: string | null,
  maxPages = 10,
): Promise<{ messages: GraphMessage[]; deltaLink: string | null; nextLink: string | null; truncated: boolean }> {
  let url =
    deltaLink ||
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(SUPPORT_MAILBOX)}/mailFolders/${folder}/messages/delta?$select=${SELECT}&$top=50`;

  const messages: GraphMessage[] = [];
  let nextDelta: string | null = null;
  let nextLink: string | null = null;
  let truncated = true;

  for (let page = 0; page < maxPages; page++) {
    const data = await graphFetch(url);
    for (const m of data.value || []) {
      // Deletions come through as @removed; nothing to store for those.
      if (m?.id && !m["@removed"]) messages.push(normalise(m));
    }
    if (data["@odata.nextLink"]) {
      url = data["@odata.nextLink"];
      nextLink = data["@odata.nextLink"];
      continue;
    }
    nextDelta = data["@odata.deltaLink"] || null;
    nextLink = null;
    truncated = false;
    break;
  }

  return { messages, deltaLink: nextDelta, nextLink, truncated };
}

// Send as the support mailbox. Replying to a known message id keeps the conversation
// threaded in Outlook and in the customer's client; otherwise this starts a new one.
// The sent copy lands in Sent Items, so the next sync logs it like any other reply.
export async function sendAsSupport(opts: {
  to: string;
  subject: string;
  bodyText: string;
  replyToMessageId?: string | null;
}): Promise<void> {
  const mailbox = encodeURIComponent(SUPPORT_MAILBOX);

  if (opts.replyToMessageId) {
    await graphFetch(
      `https://graph.microsoft.com/v1.0/users/${mailbox}/messages/${encodeURIComponent(opts.replyToMessageId)}/reply`,
      { method: "POST", body: JSON.stringify({ comment: opts.bodyText }) },
    );
    return;
  }

  await graphFetch(`https://graph.microsoft.com/v1.0/users/${mailbox}/sendMail`, {
    method: "POST",
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: "Text", content: opts.bodyText },
        toRecipients: [{ emailAddress: { address: opts.to } }],
      },
      saveToSentItems: true,
    }),
  });
}

// Non-secret claims from the access token. The roles claim is the quickest way to
// tell a permissions mistake (granted as Delegated, so no roles at all) apart from an
// Exchange-side refusal (roles present, but the mailbox is out of policy scope).
function tokenClaims(jwt: string): { appId?: string; tenant?: string; roles?: string[] } {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
    return { appId: payload.appid || payload.azp, tenant: payload.tid, roles: payload.roles || [] };
  } catch {
    return {};
  }
}

// Cheap credential check used by the portal and the sync route.
export async function graphHealth(): Promise<{
  ok: boolean;
  mailbox: string;
  token?: { appId?: string; tenant?: string; roles?: string[] };
  diagnosis?: string;
  error?: string;
}> {
  if (!graphConfigured()) {
    return { ok: false, mailbox: SUPPORT_MAILBOX, error: "MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET not set" };
  }

  let claims: { appId?: string; tenant?: string; roles?: string[] } = {};
  try {
    claims = tokenClaims(await accessToken());
  } catch (e) {
    return { ok: false, mailbox: SUPPORT_MAILBOX, error: `Could not get a token: ${String(e).slice(0, 300)}` };
  }

  try {
    await graphFetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(SUPPORT_MAILBOX)}/mailFolders/inbox?$select=id,totalItemCount`,
    );
    return { ok: true, mailbox: SUPPORT_MAILBOX, token: claims };
  } catch (e) {
    const error = String(e).slice(0, 300);
    const roles = claims.roles || [];
    const hasMailRead = roles.some(r => r === "Mail.Read" || r === "Mail.ReadWrite");
    const diagnosis = !roles.length
      ? "The token carries no application roles. The permissions were most likely added as Delegated rather than Application, or admin consent hasn't been granted."
      : !hasMailRead
        ? `The token has roles [${roles.join(", ")}] but not Mail.Read. Add Mail.Read as an Application permission and grant admin consent.`
        : "Mail.Read is present, so this is an Exchange-side refusal: the Application Access Policy either doesn't include this mailbox, or hasn't propagated yet (it can take over an hour). Verify with Test-ApplicationAccessPolicy.";
    return { ok: false, mailbox: SUPPORT_MAILBOX, token: claims, diagnosis, error };
  }
}
