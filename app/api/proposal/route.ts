import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, PageSizes, rgb, PDFName, PDFString, PDFArray } from "pdf-lib";
import { addFileToItem } from "@/lib/monday";

export const runtime = "nodejs";

// ── Colour helpers ─────────────────────────────────────────────────────────────
function c(hex: string) {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
}

const TEAL   = c("#14b8a6");
const TEAL_L = c("#f0fdfa");
const TEAL_D = c("#0f766e");
const DARK   = c("#0f172a");
const MID    = c("#475569");
const LIGHT  = c("#94a3b8");
const BORDER = c("#e2e8f0");
const WHITE  = rgb(1, 1, 1);

// ── Tier data ─────────────────────────────────────────────────────────────────
const TIERS: Record<string, { label: string; usd: string; zar: string; period: string; isPromo: boolean }> = {
  "PROMOTIONAL (Base + Free 2 Months)": {
    label: "Promotional - Limited Time Offer",
    usd: "$3,000 flat", zar: "R60,000 flat",
    period: "90 days total (30-day build - 60 days support FREE)",
    isPromo: true,
  },
  Premium: {
    label: "Premium",
    usd: "$5,000 flat", zar: "R100,000 flat",
    period: "120 days total (30-day build - 60 days support - +30 days FREE)",
    isPromo: false,
  },
};

function fmt(d: Date) {
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

// Strip characters outside Latin-1 (WinAnsi). Must be called before drawText.
function sanitize(text: string): string {
  return text
    .replace(/[→⇒]/g, "->")
    .replace(/[←⇐]/g, "<-")
    .replace(/[↑↓]/g, "|")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/…/g, "...")   // ellipsis
    .replace(/[•‣·]/g, "-")
    .replace(/–/g, "-")     // en dash (U+2013)
    .replace(/—/g, " - ")  // em dash (U+2014)
    .replace(/[^ -ÿ]/g, ""); // drop any remaining non-Latin-1 chars
}

function wrapText(
  text: string,
  widthOf: (s: string) => number,
  maxW: number,
): string[] {
  if (!text?.trim()) return [];
  const words = sanitize(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (widthOf(test) <= maxW) { line = test; }
    else { if (line) lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  const currency: "USD" | "ZAR" = b.currency === "ZAR" ? "ZAR" : "USD";
  const tier: string = b.tier || "Premium";
  const pkg = TIERS[tier] ?? TIERS.Premium;
  const price = currency === "ZAR" ? pkg.zar : pkg.usd;
  const mondayItemId: string | undefined = b.mondayItemId;

  const refNo = `SL-${Date.now().toString().slice(-8)}`;
  const today  = fmt(new Date());
  const expiry = fmt(new Date(Date.now() + 14 * 864e5));

  // Signing URL — includes tier key and currency so the sign page knows the amount
  const host    = req.headers.get("host") || "the-start-up-eight.vercel.app";
  const proto   = host.startsWith("localhost") ? "http" : "https";
  const tierKey = pkg.isPromo ? "promo" : "premium";
  const signUrl = `${proto}://${host}/sign?ref=${refNo}&t=${tierKey}&c=${currency}${mondayItemId ? `&item=${mondayItemId}` : ""}`;

  // ── Create PDF document ────────────────────────────────────────────────────
  // pdf-lib embedStandardFont uses WinAnsi name references — no file I/O.
  const doc = await PDFDocument.create();
  doc.setTitle("Service Proposal - The Startup");
  doc.setAuthor("The Startup");
  doc.setSubject(`Scope Lock Agreement - ${b.company || "Client"}`);

  const fontR = await doc.embedStandardFont(StandardFonts.Helvetica);
  const fontB = await doc.embedStandardFont(StandardFonts.HelveticaBold);

  const [W, H] = PageSizes.A4;
  const ML = 55;
  const CW = W - ML * 2;
  const FOOTER_H = 26;
  const MIN_Y = FOOTER_H + 44;

  // ── Page / cursor state ────────────────────────────────────────────────────
  let page = doc.addPage(PageSizes.A4);
  // cy = current y from bottom (pdf-lib native). Decreases as content flows down.
  let cy = H;

  function newPage() {
    page = doc.addPage(PageSizes.A4);
    cy = H - 55;
  }
  function checkBreak(needed: number) {
    if (cy - needed < MIN_Y) newPage();
  }

  // ── Drawing primitives ─────────────────────────────────────────────────────
  type AnyColor = ReturnType<typeof rgb>;

  // topY = top edge of element (pdf-lib y from bottom)
  function rFill(x: number, topY: number, w: number, h: number, color: AnyColor) {
    page.drawRectangle({ x, y: topY - h, width: w, height: h, color });
  }
  function rBorder(x: number, topY: number, w: number, h: number, color: AnyColor, bw = 0.5, dash?: number[]) {
    page.drawRectangle({
      x, y: topY - h, width: w, height: h,
      borderColor: color, borderWidth: bw,
      ...(dash ? { borderDashArray: dash } : {}),
    });
  }
  function hLine(x1: number, x2: number, y: number, color: AnyColor, t = 0.5) {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: t, color });
  }
  // topY = approximate top of the text; baseline = topY - size
  function txt(str: string, x: number, topY: number, font: typeof fontR, size: number, color: AnyColor) {
    if (!str?.trim()) return;
    page.drawText(sanitize(str), { x, y: topY - size, font, size, color });
  }
  function rtxt(str: string, rightX: number, topY: number, font: typeof fontR, size: number, color: AnyColor) {
    const w = font.widthOfTextAtSize(sanitize(str), size);
    txt(str, rightX - w, topY, font, size, color);
  }

  // ── Section / field helpers ────────────────────────────────────────────────
  function sectionTitle(title: string) {
    cy -= 16;
    checkBreak(24);
    rFill(ML, cy, 3, 13, TEAL);
    txt(title.toUpperCase(), ML + 10, cy - 1, fontB, 8, DARK);
    cy -= 14;
    hLine(ML, ML + CW, cy - 2, BORDER);
    cy -= 9;
  }

  function fieldBlock(label: string, value: string | undefined) {
    if (!value?.trim()) return;
    const lines = wrapText(value, (s) => fontR.widthOfTextAtSize(s, 9), CW);
    checkBreak(11 + lines.length * 13 + 5);
    txt(label.toUpperCase(), ML, cy, fontB, 6.5, LIGHT);
    cy -= 11;
    lines.forEach((line) => {
      checkBreak(13);
      txt(line, ML, cy, fontR, 9, DARK);
      cy -= 13;
    });
    cy -= 5;
  }

  // ── HEADER (page 1) ────────────────────────────────────────────────────────
  rFill(0, H, W, 90, DARK);
  rFill(0, H - 90, W, 3, TEAL);

  txt("THE",     ML, H - 14, fontR, 7,    TEAL);
  txt("STARTUP", ML, H - 36, fontB, 22,   WHITE);
  txt("Service Proposal & Scope Lock Agreement", ML, H - 66, fontR, 8.5, LIGHT);

  rtxt(`Reference: ${refNo}`,    W - ML, H - 14, fontR, 7.5, LIGHT);
  rtxt(`Issued: ${today}`,       W - ML, H - 27, fontR, 7.5, LIGHT);
  rtxt(`Valid until: ${expiry}`, W - ML, H - 40, fontR, 7.5, LIGHT);

  cy = H - 106;

  // ── INFO BAR ───────────────────────────────────────────────────────────────
  const barH = 52;
  rFill(ML, cy, CW, barH, TEAL_L);
  rFill(ML, cy, 4,  barH, TEAL);
  txt("PREPARED FOR",                   ML + 12, cy - 9,  fontB, 7,  TEAL_D);
  txt(b.company || "Your Organisation", ML + 12, cy - 22, fontB, 15, DARK);
  const contactLine = [b.contact, b.email].filter(Boolean).join("   -   ");
  txt(contactLine,                      ML + 12, cy - 40, fontR, 8,  MID);
  cy -= barH + 8;

  // ── CLIENT INFORMATION ─────────────────────────────────────────────────────
  sectionTitle("Client Information");
  fieldBlock("Company / Organisation", b.company);
  fieldBlock("Contact Name", b.contact);
  fieldBlock("Email Address", b.email);
  fieldBlock("Preferred Currency", currency);

  // ── SELECTED PACKAGE ───────────────────────────────────────────────────────
  sectionTitle("Selected Package");

  const pkgH = 88;
  checkBreak(pkgH + 10);
  rFill(ML, cy, CW, pkgH, DARK);
  rFill(ML, cy, 4,  pkgH, TEAL);

  // Label (size 8) — topY cy-10, baseline cy-18
  txt(pkg.label.toUpperCase(), ML + 12, cy - 10, fontB, 8,  TEAL);
  // Price (size 22) — topY cy-30, baseline cy-52. Descenders reach ~cy-56
  txt(price,                   ML + 12, cy - 30, fontB, 22, WHITE);
  // Period (size 8) — topY cy-60, baseline cy-68. Cap top ~cy-62. Gap from descenders = 6pt ✓
  txt(pkg.period,              ML + 12, cy - 60, fontR, 8,  LIGHT);
  // Feature line (size 7.5) — topY cy-74, baseline cy-81.5, well within 88pt box ✓
  const feat = pkg.isPromo
    ? "30-day build  -  60 days support FREE  -  Full handover documentation"
    : "30-day build  -  60 days support  -  +30 days FREE  -  Full handover documentation";
  txt(feat, ML + 12, cy - 74, fontR, 7.5, TEAL);

  cy -= pkgH + 8;

  // ── PROJECT SCOPE ──────────────────────────────────────────────────────────
  sectionTitle("Project Scope (as submitted)");
  fieldBlock("Business Objective / Outcome Sought", b.goal);
  fieldBlock("Current Bottleneck", b.bottleneck);
  fieldBlock("Core Workflow to Build", b.workflow);
  fieldBlock("Must-Have Features", b.musthaves);
  fieldBlock("Required Integrations", b.integrations || "Not specified");
  fieldBlock("Proposed Start Date", b.startDate || "To be confirmed");

  // ── WHAT'S INCLUDED ────────────────────────────────────────────────────────
  sectionTitle("What's Included in Your Build");
  const deliverables = [
    "One core workflow built end-to-end (capture > score > route > report)",
    "CRM board your team already knows how to use on day one",
    "One reporting dashboard with the metrics leadership actually watches",
    "One third-party integration (your CRM, enrichment tool, or calendar)",
    "Team training session, recorded and yours to keep",
    "Full handover documentation - you own the system completely",
  ];
  deliverables.forEach((item) => {
    const lines = wrapText(item, (s) => fontR.widthOfTextAtSize(s, 9), CW - 12);
    checkBreak(lines.length * 13 + 6);
    rFill(ML, cy - 4, 4, 4, TEAL);
    lines.forEach((line) => { txt(line, ML + 11, cy, fontR, 9, MID); cy -= 13; });
    cy -= 3;
  });

  // ── TIMELINE ───────────────────────────────────────────────────────────────
  sectionTitle("Project Timeline");
  type Phase = [string, string, string, boolean];
  const phases: Phase[] = [
    ["Build Phase",    "Day 1-30",  "System scoped, configured, tested, and delivered", false],
    ["Support Phase",  "Day 31-90", "Active support: training, optimisation, bug fixes", false],
    ...(!pkg.isPromo ? [["Free Support Extension", "Day 91-120", "30 additional days at no charge", false] as Phase] : []),
    ["Total Engagement", `${pkg.isPromo ? 90 : 120} days`, "From signed agreement to end of support", true],
  ];
  const p1W = CW * 0.37;
  const p2W = CW * 0.2;
  const p3X = ML + p1W + p2W + 6;
  const p3W = CW - p1W - p2W - 6;
  phases.forEach(([phaseName, period, note, isFinal]) => {
    checkBreak(22);
    if (isFinal) { rFill(ML, cy, CW, 20, TEAL_L); rFill(ML, cy, 3, 20, TEAL); }
    txt(phaseName, ML + (isFinal ? 6 : 8), cy - 1, isFinal ? fontB : fontR, 9, DARK);
    rtxt(period, ML + p1W + p2W, cy - 1, fontB, 9, isFinal ? TEAL : MID);
    const noteLines = wrapText(note, (s) => fontR.widthOfTextAtSize(s, 8), p3W);
    noteLines.forEach((nl, ni) => txt(nl, p3X, cy - ni * 10, fontR, 8, LIGHT));
    cy -= 22;
  });

  // ── INVESTMENT SUMMARY ─────────────────────────────────────────────────────
  sectionTitle("Investment Summary");
  type IRow = [string, string, string];
  const isZar = currency === "ZAR";
  const invDeposit = pkg.isPromo ? (isZar ? "R6,000"  : "$300")    : (isZar ? "R10,000" : "$500");
  const invMvp     = pkg.isPromo ? (isZar ? "R48,000" : "$2,400")  : (isZar ? "R80,000" : "$4,000");
  const invBalance = pkg.isPromo ? (isZar ? "R6,000"  : "$300")    : (isZar ? "R10,000" : "$500");
  const invRows: IRow[] = [
    ["Deposit - 10%",          invDeposit, "Due on signature - secures your start date"],
    ["MVP Approval - 80%",     invMvp,     "Due once MVP plan is reviewed and approved by client"],
    ["Final Balance - 10%",    invBalance, "Due at end of 30-day build on delivery"],
    ["Total Investment",       price,      "Fixed price - no overruns"],
  ];
  const i1W = CW * 0.44;
  const i2W = CW * 0.22;
  const i3X = ML + i1W + i2W + 6;
  const i3W = CW - i1W - i2W - 6;
  invRows.forEach(([item, amount, note]) => {
    const nLines = wrapText(note, (s) => fontR.widthOfTextAtSize(s, 8), i3W);
    checkBreak(nLines.length * 10 + 8);
    txt(item, ML, cy - 1, fontB, 9, DARK);
    rtxt(amount, ML + i1W + i2W, cy - 1, fontB, 9, TEAL);
    nLines.forEach((nl, ni) => txt(nl, i3X, cy - ni * 10, fontR, 8, LIGHT));
    cy -= Math.max(nLines.length * 10, 12) + 8;
  });

  // ── TERMS & CONDITIONS ─────────────────────────────────────────────────────
  if (cy < MIN_Y + 200) newPage();
  sectionTitle("Terms & Conditions");
  const tcs: [string, string][] = [
    ["1. Scope & Agreement", "This document constitutes a binding service proposal between The Startup (service provider) and the client named herein. Scope is limited to what is described; changes require written amendment and may affect timeline and price."],
    ["2. 30-Day Build Guarantee", "We commit to delivering a working system within 30 calendar days of the confirmed build start. If we miss this for reasons attributable solely to us, the client receives an additional 30 days of support at no cost."],
    ["3. Payment Terms", "All tiers follow a three-stage schedule: 10% deposit on signature (secures your start date); 80% on MVP plan approval (client must review and approve before build continues); 10% final balance on delivery at end of the 30-day build. Invoices are due within 5 business days. Overdue payments may pause the build."],
    ["4. Ownership of Deliverables", "All custom configurations, automations, dashboards, and documentation become the client's property upon final payment. The Startup retains rights to its reusable internal frameworks and methodologies."],
    ["5. Third-Party Subscriptions & Tools", "The client is solely responsible for the cost of all third-party tools, platforms, APIs, and software subscriptions required to operate and maintain the delivered system. This includes — but is not limited to — Monday.com workspace subscriptions, cloud hosting fees, domain registration, payment processing fees, API usage costs, and any SaaS tools integrated during the build. A Budget & Subscriptions board is provided with the project outlining estimated monthly and annual costs. These ongoing costs are entirely separate from The Startup's service fee and are not included in the project price."],
    ["6. Support Period", "The support period covers active system support, bug fixes, optimisation, and training. It begins on handover and does not include new feature development."],
    ["7. Confidentiality", "Both parties agree to keep all project details, business information, and proprietary data confidential and will not disclose to third parties without prior written consent."],
    ["8. Cancellation Policy", "Before build start: full refund minus 10% scoping and admin fee. After build start: deposit is non-refundable; remaining work invoiced at a pro-rata day rate."],
    ["9. Limitation of Liability", "The Startup's total liability is limited to the fees paid under this agreement. We are not liable for indirect, consequential, or incidental losses."],
    ["10. Force Majeure", "Neither party is liable for delays caused by circumstances beyond reasonable control, including natural disasters, government actions, or infrastructure failure."],
    ["11. Governing Law", "This agreement is governed by the laws of the Republic of South Africa. Disputes are subject to the exclusive jurisdiction of the South African courts."],
  ];
  tcs.forEach(([title, body]) => {
    const bodyLines = wrapText(body, (s) => fontR.widthOfTextAtSize(s, 7.5), CW);
    checkBreak(11 + bodyLines.length * 10 + 6);
    txt(title, ML, cy, fontB, 8, DARK);
    cy -= 12;
    bodyLines.forEach((line) => { txt(line, ML, cy, fontR, 7.5, MID); cy -= 10; });
    cy -= 6;
  });

  // ── PAYMENT METHODS ────────────────────────────────────────────────────────
  sectionTitle("Payment Methods");
  ([
    ["EFT / Bank Transfer",  "Details on invoice (Capitec / Standard Bank). Reference your proposal number."],
    ["Credit / Debit Card",  "Secure payment link sent with invoice (Stripe or PayFast for South African clients)."],
    ["PayPal / Wise",        "Available for international clients. USD pricing applies."],
    ["Cryptocurrency",       "BTC, ETH, or USDC accepted on request. Wallet details provided on confirmation."],
  ] as [string, string][]).forEach(([method, detail]) => {
    const dLines = wrapText(detail, (s) => fontR.widthOfTextAtSize(s, 8), CW - 12);
    checkBreak(12 + dLines.length * 10 + 6);
    rFill(ML, cy - 4, 4, 4, TEAL);
    txt(method, ML + 11, cy, fontB, 8.5, DARK);
    cy -= 13;
    dLines.forEach((line) => { txt(line, ML + 11, cy, fontR, 8, MID); cy -= 10; });
    cy -= 5;
  });

  // ── ACKNOWLEDGEMENT ────────────────────────────────────────────────────────
  if (cy < MIN_Y + 160) newPage();
  sectionTitle("Client Acknowledgement");
  txt("By signing below, the client confirms and agrees to each of the following statements:", ML, cy, fontR, 9, MID);
  cy -= 18;
  const acks = [
    "The information provided in the Scope Lock form is accurate and complete to the best of my knowledge.",
    "I have read and understood the Terms & Conditions stated in this document.",
    "I agree to the investment amount, payment schedule, and pricing as outlined in this proposal.",
    "I understand this agreement becomes legally binding upon my signature and receipt of the 10% deposit.",
  ];
  acks.forEach((ack) => {
    const aLines = wrapText(ack, (s) => fontR.widthOfTextAtSize(s, 9), CW - 16);
    checkBreak(aLines.length * 13 + 8);
    rBorder(ML, cy - 1, 9, 9, MID, 0.75);
    aLines.forEach((line, i) => txt(line, ML + 16, cy - i * 13, fontR, 9, DARK));
    cy -= aLines.length * 13 + 8;
  });

  // ── SIGNATURE BLOCKS ───────────────────────────────────────────────────────
  if (cy < MIN_Y + 140) newPage();
  cy -= 18;
  const sigHalf = (CW - 24) / 2;
  const rX = ML + sigHalf + 24;
  txt("CLIENT SIGNATURE",            ML, cy, fontB, 8, DARK);
  txt("AUTHORISED BY - THE STARTUP", rX, cy, fontB, 8, DARK);
  cy -= 20;
  const sigLine = (x: number, y: number, label: string) => {
    hLine(x, x + sigHalf, y, BORDER);
    txt(label, x, y - 10, fontR, 7, LIGHT);
  };
  const L0 = cy, L1 = cy - 36, L2 = cy - 66, L3 = cy - 96;
  sigLine(ML, L0, "Signature");
  sigLine(ML, L1, "Full Name (Printed)");
  sigLine(ML, L2, "Title / Position");
  sigLine(ML, L3, "Date");
  sigLine(rX, L0, "Authorised Signature");
  sigLine(rX, L1, "Full Name (Printed)");
  sigLine(rX, L2, "Date");
  rBorder(rX + sigHalf - 74, L2 - 14, 70, 42, BORDER, 0.5, [3, 2]);
  const stampLabel = "Company Stamp";
  const stW = fontR.widthOfTextAtSize(stampLabel, 7);
  txt(stampLabel, rX + sigHalf - 74 + (70 - stW) / 2, L2 - 34, fontR, 7, LIGHT);
  cy = L3 - 18;

  // ── SUBMIT SIGNED COPY ─────────────────────────────────────────────────────
  if (cy < MIN_Y + 80) newPage();
  cy -= 12;

  // Teal submit box
  const submitH = 52;
  checkBreak(submitH);
  rFill(ML, cy, CW, submitH, TEAL_L);
  rFill(ML, cy, 4,  submitH, TEAL);
  txt("SIGN & PAY ONLINE", ML + 12, cy - 10, fontB, 8, TEAL_D);
  txt("Sign this agreement digitally and complete your payment in one step:", ML + 12, cy - 23, fontR, 8, MID);

  // Draw the submission URL as a clickable teal link
  const urlTopY = cy - 36;
  txt(signUrl, ML + 12, urlTopY, fontB, 8.5, TEAL);

  // Link annotation over the URL text
  const urlW = Math.min(fontB.widthOfTextAtSize(sanitize(signUrl), 8.5), CW - 24);
  const annotRect = [ML + 12, urlTopY - 8.5, ML + 12 + urlW, urlTopY] as const;
  const annotObj = doc.context.register(
    doc.context.obj({
      Type: PDFName.of("Annot"),
      Subtype: PDFName.of("Link"),
      Rect: annotRect,
      Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(signUrl) },
    }),
  );
  const existingAnnots = page.node.lookup(PDFName.of("Annots"));
  if (existingAnnots instanceof PDFArray) {
    existingAnnots.push(annotObj);
  } else {
    page.node.set(PDFName.of("Annots"), doc.context.obj([annotObj]));
  }

  cy -= submitH + 8;

  // ── FOOTER ON ALL PAGES ────────────────────────────────────────────────────
  const allPages = doc.getPages();
  const pageCount = allPages.length;
  allPages.forEach((p, i) => {
    p.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_H, color: DARK });
    p.drawText(`The Startup  -  ${refNo}  -  Confidential`, {
      x: ML, y: 9, font: fontR, size: 7, color: LIGHT,
    });
    const ps = `Page ${i + 1} of ${pageCount}`;
    const psW = fontR.widthOfTextAtSize(ps, 7);
    p.drawText(ps, { x: W - ML - psW, y: 9, font: fontR, size: 7, color: LIGHT });
  });

  // ── Serialize ──────────────────────────────────────────────────────────────
  const pdfBytes = await doc.save();
  const safeName = `proposal-${(b.company || "client")
    .replace(/[^a-z0-9]/gi, "-").slice(0, 40).toLowerCase()}`;

  // ── Auto-attach to Monday.com item (fire-and-forget) ──────────────────────
  if (mondayItemId) {
    addFileToItem(
      mondayItemId,
      Buffer.from(pdfBytes),
      `${safeName}.pdf`,
      `Proposal PDF generated for ${b.company || "client"} — ref ${refNo}`,
    ).catch(() => null);
  }

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
    },
  });
}
