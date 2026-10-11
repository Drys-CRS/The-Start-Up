// The sign-off on replies sent from the admin portal.
//
// Built from lib/company so the address and number in a reply are the same
// ones on the site footer, the legal pages and the agreement. A signature
// that drifts from the contact details on the page is how a customer ends up
// phoning a line nobody answers.

import { COMPANY, addressOneLine } from "./company";
import { SITE_URL } from "./site";

/** Plain text, because Graph sends replies as text. */
export function signature(sender?: string | null): string {
  const who = (sender || "").trim();
  const name = who ? who.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : COMPANY.brand;

  // Each line only appears once it has a value, so an unfilled detail is
  // absent rather than a blank line or the word "undefined".
  return [
    "Regards,",
    name,
    COMPANY.brand,
    COMPANY.legalName,
    addressOneLine(),
    COMPANY.phone,
    COMPANY.supportEmail,
    SITE_URL.replace(/^https?:\/\//, ""),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Append it, unless the writer has already signed off themselves. */
export function withSignature(body: string, sender?: string | null): string {
  const text = (body || "").trimEnd();
  if (/\b(regards|thanks|cheers|best)\b[,\s]*$/i.test(text.split("\n").slice(-4).join("\n"))) return text;
  if (text.includes(COMPANY.supportEmail)) return text;
  return `${text}\n\n${signature(sender)}`;
}
