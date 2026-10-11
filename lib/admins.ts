// Who may open the admin portal.
//
// A hardcoded seed plus a comma-separated ADMIN_EMAILS override, the same
// shape as the partner portal's staff allowlist: the list keeps working if the
// environment variable is never set, and adding someone does not need a
// deploy. An address not on this list is never sent an admin link, so adding
// an administrator is a deliberate act in one place.
//
// Membership is checked on the way IN (before a link is sent) and again on the
// way OUT (before a session is issued), so removing someone from this list and
// deploying locks them out even if they are holding an unspent link.

const SEED = [
  "drystan.govender@cyberretaliatorsolutions.com",
  "dylan@cyberretaliatorsolutions.com",
];

export function adminEmails(): string[] {
  const extra = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...SEED, ...extra]));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}
