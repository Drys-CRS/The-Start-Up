import { Resend } from "resend";
import { stageMeta } from "./status";
import { SITE_URL } from "./site";

// Resend is optional: if RESEND_API_KEY is unset (local/dev), every send is a
// silent no-op so email is never a hard dependency of the sign/payment path.
// RESEND_FROM and TEAM_NOTIFY_EMAIL are the canonical names; NOTIFY_FROM_EMAIL and
// NOTIFY_EMAIL are accepted as aliases because some environments already use them.
const KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.RESEND_FROM || process.env.NOTIFY_FROM_EMAIL || "The Startup <onboarding@resend.dev>";
const TEAM_TO = process.env.TEAM_NOTIFY_EMAIL || process.env.NOTIFY_EMAIL || "";
const BASE_URL = SITE_URL;

const resend = KEY ? new Resend(KEY) : null;

const TEAL = "#14b8a6";
const DARK = "#0f172a";
const MID = "#475569";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function statusHtml(stageLabel: string, ref: string): string {
  const m = stageMeta(stageLabel);
  const trackUrl = `${BASE_URL}/status${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:${DARK};border-radius:12px 12px 0 0;padding:20px 24px;">
      <span style="color:#fff;font-size:16px;font-weight:800;letter-spacing:0.5px;">THE STARTUP</span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:28px 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${TEAL};text-transform:uppercase;letter-spacing:0.5px;">Status update</p>
      <h1 style="margin:0 0 12px;font-size:20px;color:${DARK};">${m.title}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MID};">${m.description}</p>
      <div style="background:#f0fdfa;border:1px solid ${TEAL}40;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0f766e;">WHAT'S NEXT</p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:${MID};">${m.next}</p>
      </div>
      <a href="${trackUrl}" style="display:inline-block;background:${TEAL};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:8px;">Track your build status →</a>
      ${ref ? `<p style="margin:18px 0 0;font-size:12px;color:#94a3b8;">Reference: ${escapeHtml(ref)}</p>` : ""}
    </div>
  </div>`;
}

// Send a status-change email to the customer. Never throws — email failure must
// not fail the webhook/sign response. Returns true if an email was actually sent.
export async function sendStatusEmail(opts: {
  to?: string | null;
  stageLabel: string;
  ref?: string;
}): Promise<boolean> {
  const { to, stageLabel } = opts;
  const ref = opts.ref || "";
  if (!resend || !to || !stageLabel) return false;

  const m = stageMeta(stageLabel);
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Your build update: ${m.title}`,
      html: statusHtml(stageLabel, ref),
    });
    return true;
  } catch (e) {
    console.error("sendStatusEmail failed", e);
    return false;
  }
}

// Notify the internal team that a customer requested an update. Best-effort.
export async function sendTeamUpdateRequest(opts: {
  ref: string;
  email: string;
  message: string;
}): Promise<boolean> {
  if (!resend || !TEAM_TO) return false;
  try {
    await resend.emails.send({
      from: FROM,
      to: TEAM_TO,
      subject: `Update requested — ${opts.ref}`,
      html: `<p><strong>${escapeHtml(opts.email)}</strong> requested an update on <strong>${escapeHtml(opts.ref)}</strong>:</p><p>${escapeHtml(opts.message)}</p>`,
    });
    return true;
  } catch (e) {
    console.error("sendTeamUpdateRequest failed", e);
    return false;
  }
}
