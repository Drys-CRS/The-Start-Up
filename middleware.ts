import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";
import { readSessionEdge } from "@/lib/session-edge";

// Runs on page and API requests (static assets are excluded by the matcher).
//
// 1. Alias domains -> canonical domain. Page requests on any host other than
//    SITE_URL's are permanently redirected, so search engines index one site.
//    Vercel preview URLs and localhost are left alone, and so is /api/*: Stripe
//    webhooks don't follow redirects, whichever domain they're registered on.
//
// 2. Admin gate. /admin and the internal /api/agent and /api/dev routes need a
//    signed admin session, which you get by clicking a one-time link emailed
//    to an address on the allowlist in lib/admins.ts. Fails closed: no signing
//    secret, no entry.
//
//    ADMIN_PASSWORD is still accepted on the two /api prefixes, and only
//    there. Those are called by scripts and by curl during an incident, where
//    a browser sign-in round trip is not available. The admin UI itself is
//    session-only, so the shared password is no longer enough to read
//    everyone's mail from a browser.

const CANONICAL_HOST = new URL(SITE_URL).host;
const ADMIN_PAGES = "/admin";
const ADMIN_APIS = ["/api/agent", "/api/dev"];

// Reachable without a session, or nobody could ever get one.
const ADMIN_PUBLIC = ["/admin/login", "/admin/enter"];

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

function hasBasicAuth(req: NextRequest): boolean {
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

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = (req.headers.get("host") || "").toLowerCase();

  if (host && host !== CANONICAL_HOST && !isExemptHost(host) && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL(pathname + search, SITE_URL), 308);
  }

  // The sign-in pages and the two endpoints behind them stay open. The
  // pathname is forwarded so the admin layout knows not to wrap a sign-in
  // page in the signed-in chrome.
  if (ADMIN_PUBLIC.some(p => under(pathname, p)) || under(pathname, "/api/admin")) {
    const headers = new Headers(req.headers);
    headers.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  const isAdminPage = under(pathname, ADMIN_PAGES);
  const isAdminApi = ADMIN_APIS.some(p => under(pathname, p));
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const signedIn = await readSessionEdge(req.cookies.get("tsu_admin")?.value, "admin");
  if (signedIn) return NextResponse.next();

  if (isAdminApi && hasBasicAuth(req)) return NextResponse.next();

  if (isAdminPage) {
    // Send them to sign in, and back to where they were aiming afterwards.
    const to = new URL("/admin/login", req.nextUrl.origin);
    if (pathname !== "/admin") to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="The Start Up admin", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|xml|txt)$).*)"],
};
