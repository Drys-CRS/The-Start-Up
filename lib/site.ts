// Canonical public origin. Every absolute URL the app emits (metadata, sitemap,
// robots, email links, Stripe redirects) and the alias-domain redirect in
// middleware.ts derive from this, so the site only ever points at one domain.
// NEXT_PUBLIC_BASE_URL is accepted as an older alias of NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://tsu.agency"
).replace(/\/+$/, "");
