// The sign-off on replies sent from the admin portal.
//
// Built from lib/company so the address in a reply is the same one on the
// site footer, the legal pages and the agreement. A signature that drifts
// from the contact details on the page is how a customer ends up emailing a
// mailbox nobody reads.

import { COMPANY } from "./company";
import { SITE_URL } from "./site";

/** Plain text, because Graph sends replies as text. */
export function signature(sender?: string | null): string {
  const who = (sender || "").trim();
  const name = who ? who.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : COMPANY.brand;

  return [
    "Regards,",
    name,
    COMPANY.brand,
    COMPANY.supportEmail,
    SITE_URL.replace(/^https?:\/\//, ""),
  ].join("\n");
}

/** Append it, unless the writer has already signed off themselves. */
export function withSignature(body: string, sender?: string | null): string {
  const text = (body || "").trimEnd();
  if (/\b(regards|thanks|cheers|best)\b[,\s]*$/i.test(text.split("\n").slice(-4).join("\n"))) return text;
  if (text.includes(COMPANY.supportEmail)) return text;
  return `${text}\n\n${signature(sender)}`;
}
