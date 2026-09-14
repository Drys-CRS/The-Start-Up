// Legacy Stripe webhook path, kept as an alias so payments keep reaching Monday
// whichever of the two URLs the Stripe endpoint is registered on.
// All handling lives in app/api/stripe-webhook/route.ts.
export { POST } from "../stripe-webhook/route";

export const runtime = "nodejs";
