import { NextRequest, NextResponse } from "next/server";

// Per-IP fixed-window rate limiter for the public API routes.
//
// State lives in module memory, so limits apply per function instance rather than
// globally. Fluid Compute reuses instances across many requests, which makes this an
// effective brake on one client hammering the AI and Monday routes, but not a hard
// guarantee. For a global ceiling, add a Vercel Firewall rate-limit rule on /api/*.

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();
const MAX_TRACKED = 5_000;

function clientIp(req: NextRequest): string {
  // Vercel sets x-forwarded-for to the real client IP, so its first entry is trustworthy there.
  return (
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Returns a 429 response once the caller exceeds `limit` requests per `windowMs`
// on the route `name`, otherwise null. Use as: `if (limited) return limited;`
export function rateLimit(
  req: NextRequest,
  name: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  const key = `${name}:${clientIp(req)}`;

  let w = windows.get(key);
  if (!w || w.resetAt <= now) {
    if (windows.size >= MAX_TRACKED) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
      if (windows.size >= MAX_TRACKED) windows.clear();
    }
    w = { count: 0, resetAt: now + windowMs };
    windows.set(key, w);
  }

  w.count += 1;
  if (w.count <= limit) return null;

  return NextResponse.json(
    { error: "Too many requests — please wait a minute and try again." },
    { status: 429, headers: { "Retry-After": String(Math.ceil((w.resetAt - now) / 1000)) } },
  );
}
