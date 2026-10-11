// Session verification for the middleware.
//
// A second implementation of readSession, not a duplicate by accident: Next
// 14's middleware runs on the Edge runtime, which has no node:crypto, so the
// HMAC has to come from Web Crypto and that makes it async. lib/portal-auth.ts
// stays synchronous for everything running under Node.
//
// The two must agree exactly on the payload format: "<scope>.<email>.<expiry>"
// signed with HMAC-SHA256 and base64url encoded. Change one, change both.

export type Scope = "customer" | "admin";

function sessionKey(): string | null {
  return process.env.PORTAL_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

const toBase64Url = (bytes: ArrayBuffer): string => {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** The signed-in address, or null. Mirrors readSession in lib/portal-auth.ts. */
export async function readSessionEdge(
  cookie: string | undefined,
  scope: Scope,
  now: number = Date.now(),
): Promise<string | null> {
  const key = sessionKey();
  if (!key || !cookie) return null;

  const parts = cookie.split(".");
  if (parts.length !== 4) return null;
  const [cookieScope, encoded, expiry, signature] = parts;
  if (cookieScope !== scope) return null;
  if (!Number(expiry) || Number(expiry) < now) return null;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(`${cookieScope}.${encoded}.${expiry}`));
  if (!constantTimeEqual(signature, toBase64Url(mac))) return null;

  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    return atob(padded).trim().toLowerCase() || null;
  } catch {
    return null;
  }
}
