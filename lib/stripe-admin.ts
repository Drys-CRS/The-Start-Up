// Housekeeping on the Stripe account: find what is stale and archive it.
//
// The account still carries ZAR-era products and prices from before the move
// to USD, plus the Payment Links that checkout no longer uses. None of it is
// reachable from the site any more, but a price nobody has looked at in
// months is exactly the thing that gets reused by accident, and the product
// descriptions are read by customers on the Stripe-hosted page.
//
// Nothing here deletes. Stripe does not allow deleting a price that has ever
// been used, and archiving is reversible: `active: false` hides it from the
// dashboard's default views and stops it being used in new checkouts, while
// leaving historic payments intact and auditable.

import Stripe from "stripe";

export type StaleItem = {
  kind: "price" | "product" | "payment_link";
  id: string;
  label: string;
  detail: string;
  /** Why this is on the list. */
  reason: string;
};

/**
 * What Stripe holds as the business identity.
 *
 * This is the address that already prints on receipts and invoices, so it is
 * the one the site, the legal pages and the agreement should agree with. It
 * is also where a leftover South African address would show up, which would
 * explain a good deal about the Rand-era products.
 */
export type AccountIdentity = {
  name: string | null;
  country: string | null;
  defaultCurrency: string | null;
  supportPhone: string | null;
  supportEmail: string | null;
  addressLines: string[];
};

export type Audit = {
  configured: boolean;
  currencies: Record<string, number>;
  stale: StaleItem[];
  keptProducts: { id: string; name: string; description: string | null }[];
  identity?: AccountIdentity;
  error?: string;
};

const addressOf = (a: Stripe.Address | null | undefined): string[] =>
  !a ? [] : [a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(", "), a.country].filter(Boolean) as string[];

function client(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

const money = (amount: number | null, currency: string) =>
  amount == null ? "—" : `${(amount / 100).toLocaleString("en-US")} ${currency.toUpperCase()}`;

/** Everything non-USD, plus the Payment Links checkout no longer uses. */
export async function auditStripe(): Promise<Audit> {
  const stripe = client();
  if (!stripe) return { configured: false, currencies: {}, stale: [], keptProducts: [] };

  const currencies: Record<string, number> = {};
  const stale: StaleItem[] = [];
  const keptProducts: Audit["keptProducts"] = [];

  let identity: AccountIdentity | undefined;

  try {
    // GET /v1/account returns the account the key belongs to. The SDK's typed
    // accounts.retrieve() wants an id (it is the Connect accessor), so this
    // goes straight to the endpoint.
    const res = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });
    if (res.ok) {
      const account = (await res.json()) as Stripe.Account;
      const company = account.company;
      const registered = addressOf(company?.address);
      identity = {
        name: account.business_profile?.name || company?.name || account.settings?.dashboard?.display_name || null,
        country: account.country || null,
        defaultCurrency: account.default_currency ? account.default_currency.toUpperCase() : null,
        supportPhone: account.business_profile?.support_phone || null,
        supportEmail: account.business_profile?.support_email || account.email || null,
        // Prefer the registered company address over the support one.
        addressLines: registered.length ? registered : addressOf(account.business_profile?.support_address),
      };
    } else {
      console.error("[stripe-admin] account lookup returned", res.status);
    }
  } catch (e) {
    console.error("[stripe-admin] could not read the account identity:", e);
  }

  try {
    for await (const price of stripe.prices.list({ limit: 100, active: true, expand: ["data.product"] })) {
      const cur = (price.currency || "").toLowerCase();
      currencies[cur] = (currencies[cur] || 0) + 1;

      const product = price.product as Stripe.Product | Stripe.DeletedProduct;
      const name = product && "name" in product ? product.name : price.nickname || price.id;

      if (cur !== "usd") {
        stale.push({
          kind: "price",
          id: price.id,
          label: name,
          detail: money(price.unit_amount, cur),
          reason: `Priced in ${cur.toUpperCase()}. The site has been USD-only since the rewrite.`,
        });
      }
    }

    // A product whose every active price is non-USD has nothing left to sell.
    for await (const product of stripe.products.list({ limit: 100, active: true })) {
      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
      const hasUsd = prices.data.some(p => (p.currency || "").toLowerCase() === "usd");
      const hasAny = prices.data.length > 0;

      const mentionsRand = /\bR\s?\d|\bZAR\b|rand/i.test(product.description || "");
      const staleDate = /30 sep|september 2026|ends 30/i.test(product.description || "");

      if (hasAny && !hasUsd) {
        stale.push({
          kind: "product",
          id: product.id,
          label: product.name,
          detail: product.description || "no description",
          reason: "Every active price on it is non-USD.",
        });
      } else if (mentionsRand || staleDate) {
        keptProducts.push({ id: product.id, name: product.name, description: product.description });
      } else {
        keptProducts.push({ id: product.id, name: product.name, description: product.description });
      }
    }

    // Checkout builds sessions now, so every pre-made link is unused. They are
    // listed rather than archived automatically: links already sent out in
    // email still work, and killing one silently breaks a customer's bookmark.
    for await (const link of stripe.paymentLinks.list({ limit: 100, active: true })) {
      stale.push({
        kind: "payment_link",
        id: link.id,
        label: link.url,
        detail: "Payment Link",
        reason: "Checkout no longer uses pre-made links. Archive once no outstanding email points at it.",
      });
    }
  } catch (e) {
    return {
      configured: true,
      currencies,
      stale,
      keptProducts,
      identity,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return { configured: true, currencies, stale, keptProducts, identity };
}

export type ArchiveResult = { archived: number; failed: { id: string; error: string }[] };

/** Archive by id. Reversible, and never touches historic payments. */
export async function archiveStripe(items: { kind: StaleItem["kind"]; id: string }[]): Promise<ArchiveResult> {
  const stripe = client();
  if (!stripe) return { archived: 0, failed: items.map(i => ({ id: i.id, error: "Stripe is not configured" })) };

  let archived = 0;
  const failed: ArchiveResult["failed"] = [];

  for (const item of items) {
    try {
      if (item.kind === "price") await stripe.prices.update(item.id, { active: false });
      else if (item.kind === "product") await stripe.products.update(item.id, { active: false });
      else await stripe.paymentLinks.update(item.id, { active: false });
      archived += 1;
    } catch (e) {
      failed.push({ id: item.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { archived, failed };
}

/** Rewrite a product description, for the ones still quoting Rand or a dead date. */
export async function describeProduct(id: string, description: string): Promise<{ ok: boolean; error?: string }> {
  const stripe = client();
  if (!stripe) return { ok: false, error: "Stripe is not configured" };
  try {
    await stripe.products.update(id, { description });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
