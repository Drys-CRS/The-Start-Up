// Public business identity: the site footer, the legal pages, the agreement
// and the sign-off on replies all read from here, so there is one answer to
// "how do customers reach us" rather than four that drift apart.
export const COMPANY = {
  brand: "The Start Up",
  legalName: "Cyber Retaliator Solutions LLC",
  supportEmail: "support@tsu.agency",

  // Formatted for display, in the order it should be read. Empty until the
  // real one is confirmed: every consumer below omits the block when it is
  // empty rather than printing a half address, because this appears on signed
  // agreements and legal pages where a wrong address is worse than none.
  addressLines: [] as string[],

  // E.164 for the href, and whatever reads well for the label.
  phone: "",
  phoneHref: "",
} as const;

/** The address on one line, for a signature or a PDF. Empty when unset. */
export const addressOneLine = (): string => COMPANY.addressLines.join(", ");

/** True once the postal address has actually been filled in. */
export const hasAddress = (): boolean => COMPANY.addressLines.length > 0;

/** When the legal pages last materially changed. */
export const LEGAL_UPDATED = "September 14, 2026";
