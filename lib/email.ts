import { Resend } from "resend";
import { stageMeta } from "./status";
import { statusUrl, tierKey } from "./links";
import { SITE_URL } from "./site";
import { COMPANY } from "./company";
import { findScopeLock, logEmail } from "./db";

// Resend is optional: if RESEND_API_KEY is unset (local/dev), every send is a
// silent no-op so email is never a hard dependency of the sign/payment path.
// RESEND_FROM and TEAM_NOTIFY_EMAIL are the canonical names; NOTIFY_FROM_EMAIL and
// NOTIFY_EMAIL are accepted as aliases because some environments already use them.
const KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.RESEND_FROM || process.env.NOTIFY_FROM_EMAIL || "The Startup <onboarding@resend.dev>";
const TEAM_TO = process.env.TEAM_NOTIFY_EMAIL || process.env.NOTIFY_EMAIL || "";

const resend = KEY ? new Resend(KEY) : null;

const TEAL = "#14b8a6";
const DARK = "#0f172a";
const MID = "#475569";
const LIGHT = "#94a3b8";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── Layout ────────────────────────────────────────────────────────────────────
//
// Same structure as the CRS partner portal's email layout: a slate page, the
// logo as a rounded tile, a letter-spaced brand label, one white card, a small
// footer. Our palette and our mark.
//
// Nested tables with inline styles, because that is what email clients render.
// Outlook on Windows ignores most modern CSS, so there is no flexbox, no CSS
// variables, no classes, and every colour is a literal.

const PAGE_BG = "#f1f5f9";
const CARD_BORDER = "#e2e8f0";
const FAINT = "#cbd5e1";

/** Absolute, because an email is read somewhere that is not our origin. */
const logoUrl = () => `${SITE_URL}/logo-icon.png`;

function shell(body: string, footer = ""): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${COMPANY.brand}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE_BG}">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">

          <!-- The icon has a dark background baked into it, so the rounded
               corner is what makes it read as a tile rather than a block. -->
          <tr>
            <td align="center" style="padding-bottom:10px">
              <img src="${logoUrl()}" alt="${COMPANY.brand}" width="56" height="56"
                style="display:block;width:56px;height:56px;border-radius:14px;border:0" />
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom:24px">
              <span style="display:block;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MID};text-align:center">
                ${COMPANY.brand}
              </span>
            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff;border:1px solid ${CARD_BORDER};border-radius:16px;padding:32px 28px">
              ${body}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:20px">
              ${footer ? `<p style="margin:0 0 6px;font-size:11px;line-height:1.6;color:${LIGHT};text-align:center">${footer}</p>` : ""}
              <p style="margin:0;font-size:11px;line-height:1.6;color:${FAINT};text-align:center">
                &copy; ${year} ${COMPANY.legalName}. ${COMPANY.brand} is a service of ${COMPANY.legalName}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const eyebrow = (text: string) =>
  `<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${TEAL};text-transform:uppercase;letter-spacing:0.12em">${escapeHtml(text)}</p>`;

const heading = (text: string) =>
  `<h1 style="margin:0 0 14px;font-size:21px;font-weight:700;line-height:1.3;color:${DARK}">${escapeHtml(text)}</h1>`;

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${MID}">${escapeHtml(text)}</p>`;

// A table, not a styled anchor: Outlook will not give an <a> padding, so a
// bare anchor collapses to underlined text with no button around it.
const button = (label: string, url: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0">
    <tr>
      <td align="center" style="border-radius:10px;background-color:${TEAL}">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(label)} &rarr;</a>
      </td>
    </tr>
  </table>`;

// ── Send + log ───────────────────────────────────────────────────────────────

type SendPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
  // Logged alongside the message so the admin portal can group and thread it.
  template?: string;
  ref?: string | null;
  leadId?: string | null;
};

// Resend reports API failures in its result rather than throwing, so both paths are
// checked. Never throws; returns true only when Resend accepted the email.
//
// Every attempt is written to the email log, successes and failures alike: a
// confirmation email that never sent is exactly what the portal needs to surface.
async function send(payload: SendPayload): Promise<boolean> {
  const { template, ref, leadId, ...email } = payload;
  if (!resend || !payload.to) return false;

  let providerId: string | null = null;
  let errorText: string | null = null;
  try {
    const { data, error } = await resend.emails.send({ from: FROM, ...email });
    if (error) {
      console.error("Resend rejected email", email.subject, error);
      errorText = JSON.stringify(error);
    } else {
      providerId = data?.id || null;
    }
  } catch (e) {
    console.error("Email send failed", email.subject, e);
    errorText = String(e);
  }

  await logOutbound({ email, template, ref, leadId, providerId, errorText });
  return !errorText;
}

async function logOutbound(o: {
  email: { to: string; subject: string; html: string };
  template?: string;
  ref?: string | null;
  leadId?: string | null;
  providerId: string | null;
  errorText: string | null;
}): Promise<void> {
  try {
    // The ref is the identifier every customer-facing email already carries, so the
    // log can attach itself to the right deal without callers passing ids around.
    let scopeLockId: string | null = null;
    if (o.ref) {
      const deal = await findScopeLock({ refNo: o.ref });
      scopeLockId = deal?.id || null;
    }
    await logEmail({
      direction: "outbound",
      provider: "resend",
      providerId: o.providerId,
      fromAddress: FROM,
      to: [o.email.to],
      subject: o.email.subject,
      template: o.template || null,
      bodyHtml: o.email.html,
      status: o.errorText ? "failed" : "sent",
      scopeLockId,
      leadId: o.leadId || null,
      raw: o.errorText ? { error: o.errorText } : null,
    });
  } catch {
    // logging must never affect delivery
  }
}

// ── Customer: portal sign-in link ────────────────────────────────────────────

/**
 * The one-time link that signs someone into their portal.
 *
 * The href goes to a page with a button on it, not straight to the exchange.
 * Mail security products follow links in incoming mail to check them, and a
 * single-use token spent by a scanner is one the customer never gets to use.
 */
export async function sendPortalLink(opts: {
  to: string;
  token: string;
  projects: number;
}): Promise<boolean> {
  const html = portalLinkHtml(opts);

  return send({
    to: opts.to,
    subject: "Your sign-in link",
    html,
    replyTo: TEAM_TO || undefined,
    template: "portal_sign_in",
  });
}

export function portalLinkHtml(opts: { to: string; token: string; projects: number }): string {
  const link = `${SITE_URL}/status/enter?t=${encodeURIComponent(opts.token)}`;
  const what =
    opts.projects > 1
      ? `You have ${opts.projects} projects with us, and the portal shows all of them.`
      : "It shows where your build is, what is next, and anything you have sent us.";

  const body =
    eyebrow("Sign in") +
    heading("Your link to the portal") +
    paragraph(`${what} The link below works once and expires in an hour.`) +
    button("Open my portal", link) +
    `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:${LIGHT};">` +
    `Signing in as ${escapeHtml(opts.to)}. If you did not ask for this, ignore it: nothing happens until the link is opened, ` +
    `and it stops working after an hour.</p>` +
    `<p style="margin:10px 0 0;font-size:11px;line-height:1.5;color:${LIGHT};">Button not working? Paste this into your browser: ` +
    `<a href="${escapeHtml(link)}" style="color:${TEAL};">${escapeHtml(link)}</a></p>`;

  return shell(body);
}

/** The same one-time link, for the admin portal. */
export async function sendAdminLink(opts: { to: string; token: string }): Promise<boolean> {
  return send({
    to: opts.to,
    subject: "Your admin sign-in link",
    html: adminLinkHtml(opts),
    template: "admin_sign_in",
  });
}

export function adminLinkHtml(opts: { to: string; token: string }): string {
  const link = `${SITE_URL}/admin/enter?t=${encodeURIComponent(opts.token)}`;
  const body =
    eyebrow("Admin sign-in") +
    heading("Your link to the admin portal") +
    paragraph("Works once, expires in an hour, and signs you in for twelve hours.") +
    button("Open the admin portal", link) +
    `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:${LIGHT};">` +
    `If you did not ask for this, someone has your address and is trying to reach the admin portal. ` +
    `The link alone does not let them in: it only works from this mailbox.</p>` +
    `<p style="margin:10px 0 0;font-size:11px;line-height:1.5;color:${LIGHT};">Button not working? Paste this into your browser: ` +
    `<a href="${escapeHtml(link)}" style="color:${TEAL};">${escapeHtml(link)}</a></p>`;

  return shell(body);
}

// ── Customer: status updates ─────────────────────────────────────────────────

// Send a status-change email to the customer. Never throws — email failure must
// not fail the webhook/sign response. Returns true if an email was actually sent.
export async function sendStatusEmail(opts: {
  to?: string | null;
  stageLabel: string;
  ref?: string;
}): Promise<boolean> {
  const { to, stageLabel } = opts;
  const ref = opts.ref || "";
  if (!to || !stageLabel) return false;

  return send({
    to,
    subject: `Your build update: ${stageMeta(stageLabel).title}`,
    html: statusHtml({ stageLabel, ref }),
    template: `status:${stageLabel}`,
    ref,
  });
}

export function statusHtml(opts: { stageLabel: string; ref?: string }): string {
  const { stageLabel } = opts;
  const ref = opts.ref || "";
  const m = stageMeta(stageLabel);
  const body =
    eyebrow("Status update") +
    heading(m.title) +
    paragraph(m.description) +
    `<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0f766e;">WHAT'S NEXT</p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:${MID};">${escapeHtml(m.next)}</p>
    </div>` +
    button("Track your build status", statusUrl(ref)) +
    (ref ? `<p style="margin:18px 0 0;font-size:12px;color:${LIGHT};">Reference: ${escapeHtml(ref)}</p>` : "");

  return shell(body);
}

// ── Customer: Build Plan confirmation ────────────────────────────────────────

// Sent the moment a Build Plan is submitted and carries the signing link, so the
// deal survives the customer closing the tab.
export async function sendBuildPlanConfirmation(opts: {
  to: string;
  company: string;
  ref: string;
  signUrl: string;
  tierLabel?: string;
}): Promise<boolean> {
  const forCompany = opts.company ? ` for ${opts.company}` : "";
  const body =
    eyebrow("Build Plan received") +
    heading("Your Build Plan is in") +
    paragraph(`Thanks, we've received your Build Plan${forCompany}. Your reference number is ${opts.ref}.`) +
    paragraph(
      // The Advanced engagement cannot start from a signature alone: we need
      // the call and the access review before anyone commits to a date.
      tierKey(opts.tierLabel || "") === "advanced"
        ? "We will email you within one business day to book your scoping call. Review and sign the agreement whenever suits you, and the 50% deposit confirms the work once we have agreed scope on that call."
        : "Next, review and sign your agreement, then pay the 10% deposit to confirm your start date. Signing takes about a minute.",
    ) +
    button("Review and sign", opts.signUrl) +
    `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:${LIGHT};">Check progress anytime on <a href="${escapeHtml(statusUrl(opts.ref))}" style="color:${TEAL};">your status page</a> using this reference and your email.</p>`;

  return send({
    to: opts.to,
    subject: "Your Build Plan is in — next step: sign",
    html: shell(body),
    replyTo: TEAM_TO || undefined,
    template: "build_plan_confirmation",
    ref: opts.ref,
  });
}

// ── Customer: automated follow-ups ───────────────────────────────────────────

export async function sendFollowUp(opts: {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  cta: string;
  ctaUrl: string;
  unsubscribeUrl: string;
  template?: string;
  ref?: string | null;
  leadId?: string | null;
}): Promise<boolean> {
  const body = heading(opts.heading) + opts.paragraphs.map(paragraph).join("") + button(opts.cta, opts.ctaUrl);
  const footer =
    `You're receiving this because you used The Startup's free audit or Build Plan. ` +
    `<a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${LIGHT};">Unsubscribe from reminders</a>`;

  return send({
    to: opts.to,
    subject: opts.subject,
    html: shell(body, footer),
    replyTo: TEAM_TO || undefined,
    headers: { "List-Unsubscribe": `<${opts.unsubscribeUrl}>` },
    template: opts.template || "follow_up",
    ref: opts.ref || null,
    leadId: opts.leadId || null,
  });
}

// ── Team: alerts ─────────────────────────────────────────────────────────────

type AlertValue = string | number | null | undefined;

// Internal notification for funnel events (new lead, Build Plan, signature,
// payment). Best-effort; skipped when no team inbox is configured.
export async function sendTeamAlert(opts: {
  subject: string;
  heading: string;
  rows: [string, AlertValue][];
  link?: { label: string; url: string };
  ref?: string | null;
}): Promise<boolean> {
  if (!TEAM_TO) return false;
  const rows = opts.rows
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:5px 14px 5px 0;font-size:12px;color:${LIGHT};white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td>` +
        `<td style="padding:5px 0;font-size:13px;line-height:1.5;color:${DARK};">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");
  const body =
    eyebrow("Team alert") +
    heading(opts.heading) +
    `<table style="border-collapse:collapse;margin:0 0 20px;">${rows}</table>` +
    (opts.link ? button(opts.link.label, opts.link.url) : "");

  return send({
    to: TEAM_TO,
    subject: opts.subject,
    html: shell(body),
    template: "team_alert",
    ref: opts.ref || null,
  });
}

// Notify the internal team that a customer requested an update. Best-effort.
export async function sendTeamUpdateRequest(opts: {
  ref: string;
  email: string;
  message: string;
}): Promise<boolean> {
  return sendTeamAlert({
    subject: `Update requested — ${opts.ref}`,
    heading: "A customer requested an update",
    ref: opts.ref,
    rows: [
      ["Reference", opts.ref],
      ["Email", opts.email],
      ["Message", opts.message],
    ],
  });
}
