// Sign-in for the customer portal: a one-time link, emailed.
//
// Modelled on the CRS partner portal, which is magic-link only. Two things
// carried over from how that one behaves in the wild:
//
//  1. The emailed link lands on a page with a button, and the token is only
//     spent when that button is pressed. Corporate mail scanners follow links
//     in incoming mail to check them, and a token spent by a GET is a token
//     the customer never gets to use. The link itself must be safe to fetch.
//  2. The token is never written to a log. The partner portal logs its magic
//     link and says in a comment that anyone who can read deployment logs can
//     sign in as anyone. That is a real hole and it is not repeated here.
//
// There is no account and no password. The grant is the deal: an address with
// a scope lock against it can see that scope lock, and nothing else.

import { createHash, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { supabase } from "./db";

/** How long an emailed link stays good. Matches the partner portal. */
const TOKEN_TTL_MS = 60 * 60 * 1000;

/** How long a session lasts once the link is used. */
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export const PORTAL_COOKIE = "tsu_portal";
export const ADMIN_COOKIE = "tsu_admin";

/**
 * Which portal a link or a session is for.
 *
 * Tokens and sessions are both tagged, and the tag is checked on the way out.
 * Without it, a customer link emailed to an address that also happens to be an
 * administrator's would open the admin portal when forwarded, which is a much
 * bigger thing to hand over than a view of one project.
 */
export type Scope = "customer" | "admin";

/** Admin sessions are deliberately short: this one reads everybody's mail. */
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const normaliseEmail = (e: string) => (e || "").trim().toLowerCase();

/**
 * The key sessions are signed with.
 *
 * PORTAL_SESSION_SECRET is the real one. ADMIN_PASSWORD is a fallback so the
 * portal keeps working on a deployment where the dedicated secret has not been
 * set yet; it is only ever used as an HMAC key here and never leaves the
 * server. With neither, sessions are refused rather than signed with something
 * predictable.
 */
function sessionKey(): string | null {
  return process.env.PORTAL_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

/* ------------------------------------------------------------------ tokens */

export type IssuedToken = { token: string; expiresAt: Date };

/**
 * Mint a one-time token for an address. The caller decides whether the address
 * deserves one; this only stores the hash.
 */
export async function createLoginToken(
  email: string,
  ip?: string,
  scope: Scope = "customer",
): Promise<IssuedToken | null> {
  const client = supabase();
  if (!client) return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const { error } = await client.from("portal_login_tokens").insert({
    token_hash: sha256(token),
    email: normaliseEmail(email),
    expires_at: expiresAt.toISOString(),
    requested_ip: ip || null,
    scope,
  });
  if (error) {
    console.error("[portal-auth] could not store login token:", error.message);
    return null;
  }
  return { token, expiresAt };
}

// Flat rather than a discriminated union: this project compiles with
// strict: false, where narrowing on `ok` does not reliably give you the other
// arm's fields, and the call site ends up fighting the type instead of using
// it. Same reason lib/ai.ts is shaped this way.
export type ConsumeResult = {
  ok: boolean;
  email?: string;
  reason?: "unknown" | "expired" | "used" | "unavailable";
};

/**
 * Spend a token. Succeeds at most once: the update is conditional on used_at
 * still being null, so two clicks racing each other cannot both win.
 */
export async function consumeLoginToken(token: string, scope: Scope = "customer"): Promise<ConsumeResult> {
  const client = supabase();
  if (!client) return { ok: false, reason: "unavailable" };
  if (!token || typeof token !== "string") return { ok: false, reason: "unknown" };

  const { data: row, error } = await client
    .from("portal_login_tokens")
    .select("id, email, expires_at, used_at, scope")
    .eq("token_hash", sha256(token))
    .eq("scope", scope)
    .maybeSingle();

  if (error) return { ok: false, reason: "unavailable" };
  if (!row) return { ok: false, reason: "unknown" };
  if (row.used_at) return { ok: false, reason: "used" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };

  const { data: claimed, error: claimError } = await client
    .from("portal_login_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) return { ok: false, reason: "unavailable" };
  if (!claimed) return { ok: false, reason: "used" };

  return { ok: true, email: normaliseEmail(row.email) };
}

/** Housekeeping: drop links nobody used. Called from the follow-ups cron. */
export async function purgeExpiredTokens(): Promise<number> {
  const client = supabase();
  if (!client) return 0;
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from("portal_login_tokens")
    .delete()
    .lt("expires_at", cutoff)
    .select("id");
  if (error) return 0;
  return data?.length ?? 0;
}

/* ---------------------------------------------------------------- sessions */

/**
 * A session is "<email>.<expiry>.<hmac>". No database round trip to read one,
 * and nothing in it the holder could usefully tamper with: every field is
 * covered by the signature.
 */
export function signSession(email: string, scope: Scope = "customer", now: number = Date.now()): string | null {
  const key = sessionKey();
  if (!key) return null;
  const ttl = scope === "admin" ? ADMIN_SESSION_TTL_MS : SESSION_TTL_MS;
  // The scope is inside the signed payload, so it cannot be edited into the
  // other portal's cookie.
  const payload = `${scope}.${Buffer.from(normaliseEmail(email)).toString("base64url")}.${now + ttl}`;
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function readSession(
  cookie: string | undefined,
  scope: Scope = "customer",
  now: number = Date.now(),
): string | null {
  const key = sessionKey();
  if (!key || !cookie) return null;

  const parts = cookie.split(".");
  if (parts.length !== 4) return null;
  const [cookieScope, encoded, expiry, signature] = parts;
  if (cookieScope !== scope) return null;

  const expected = createHmac("sha256", key).update(`${cookieScope}.${encoded}.${expiry}`).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (!Number(expiry) || Number(expiry) < now) return null;

  try {
    return normaliseEmail(Buffer.from(encoded, "base64url").toString("utf8")) || null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

export const adminCookieOptions = {
  ...sessionCookieOptions,
  maxAge: ADMIN_SESSION_TTL_MS / 1000,
};
