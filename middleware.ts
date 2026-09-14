import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

// Runs on page and API requests (static assets are excluded by the matcher).
//
// 1. Alias domains -> canonical domain. Page requests on any host other than
//    SITE_URL's are permanently redirected, so search engines index one site.
//    Vercel preview URLs and localhost are left alone, and so is /api/*: Stripe
//    webhooks don't follow redirects, whichever domain they're registered on.
//
// 2. Admin gate. /admin and the internal /api/agent and /api/dev routes require
//    HTTP Basic auth against ADMIN_PASSWORD (any username). Browsers cache the
//    credentials, so the admin page's own fetches to those APIs pass through.
//    Fails closed: if ADMIN_PASSWORD is unset, nobody gets in.

const CANONICAL_HOST = new URL(SITE_URL).host;
const ADMIN_PREFIXES = ["/admin", "/api/agent", "/api/dev"];

function isExemptHost(host: string): boolean {
  return host.endsWith(".vercel.app") || host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

// Constant-time for equal lengths; the Edge runtime has no crypto.timingSafeEqual.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isAdminAuthorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  return sep !== -1 && safeEqual(decoded.slice(sep + 1), expected);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = (req.headers.get("host") || "").toLowerCase();

  if (host && host !== CANONICAL_HOST && !isExemptHost(host) && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL(pathname + search, SITE_URL), 308);
  }

  const isAdminPath = ADMIN_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (isAdminPath && !isAdminAuthorized(req)) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="The Start Up admin", charset="UTF-8"',
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|xml|txt)$).*)"],
};
