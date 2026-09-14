import { Resend } from "resend";
import { stageMeta } from "./status";
import { statusUrl } from "./links";

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

function shell(body: string, footer = ""): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:${DARK};border-radius:12px 12px 0 0;padding:20px 24px;">
      <span style="color:#fff;font-size:16px;font-weight:800;letter-spacing:0.5px;">THE STARTUP</span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:28px 24px;">
      ${body}
    </div>
    ${footer ? `<p style="margin:16px 0 0;font-size:11px;line-height:1.5;color:${LIGHT};text-align:center;">${footer}</p>` : ""}
  </div>`;
}

const eyebrow = (text: string) =>
  `<p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${TEAL};text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(text)}</p>`;

const heading = (text: string) =>
  `<h1 style="margin:0 0 12px;font-size:20px;color:${DARK};">${escapeHtml(text)}</h1>`;

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MID};">${escapeHtml(text)}</p>`;

const button = (label: string, url: string) =>
  `<a href="${escapeHtml(url)}" style="display:inline-block;background:${TEAL};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:8px;">${escapeHtml(label)} →</a>`;

// Resend reports API failures in its result rather than throwing, so both paths are
// checked. Never throws; returns true only when Resend accepted the email.
async function send(payload: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}): Promise<boolean> {
  if (!resend || !payload.to) return false;
  try {
    const { error } = await resend.emails.send({ from: FROM, ...payload });
    if (error) {
      console.error("Resend rejected email", payload.subject, error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email send failed", payload.subject, e);
    return false;
  }
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

  const m = stageMeta(stageLabel);
  const body =
    eyebrow("Status update") +
    heading(m.title) +
    paragraph(m.description) +
    `<div style="background:#f0fdfa;border:1px solid ${TEAL}40;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0f766e;">WHAT'S NEXT</p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:${MID};">${escapeHtml(m.next)}</p>
    </div>` +
    button("Track your build status", statusUrl(ref)) +
    (ref ? `<p style="margin:18px 0 0;font-size:12px;color:${LIGHT};">Reference: ${escapeHtml(ref)}</p>` : "");

  return send({ to, subject: `Your build update: ${m.title}`, html: shell(body) });
}

// ── Customer: Build Plan confirmation ────────────────────────────────────────

// Sent the moment a Build Plan is submitted and carries the signing link, so the
// deal survives the customer closing the tab.
export async function sendBuildPlanConfirmation(opts: {
  to: string;
  company: string;
  ref: string;
  signUrl: string;
}): Promise<boolean> {
  const forCompany = opts.company ? ` for ${opts.company}` : "";
  const body =
    eyebrow("Build Plan received") +
    heading("Your Build Plan is in") +
    paragraph(`Thanks, we've received your Build Plan${forCompany}. Your reference number is ${opts.ref}.`) +
    paragraph("Next, review and sign your agreement, then pay the 10% deposit to confirm your start date. Signing takes about a minute.") +
    button("Review and sign", opts.signUrl) +
    `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:${LIGHT};">Check progress anytime on <a href="${escapeHtml(statusUrl(opts.ref))}" style="color:${TEAL};">your status page</a> using this reference and your email.</p>`;

  return send({
    to: opts.to,
    subject: "Your Build Plan is in — next step: sign",
    html: shell(body),
    replyTo: TEAM_TO || undefined,
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

  return send({ to: TEAM_TO, subject: opts.subject, html: shell(body) });
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
    rows: [
      ["Reference", opts.ref],
      ["Email", opts.email],
      ["Message", opts.message],
    ],
  });
}
