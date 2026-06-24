import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

// ── Colour palette (matches site) ────────────────────────────────────────────
const C = {
  teal:   "#14b8a6",
  tealL:  "#f0fdfa",
  tealD:  "#0f766e",
  dark:   "#0f172a",
  mid:    "#475569",
  light:  "#94a3b8",
  border: "#e2e8f0",
  white:  "#ffffff",
};

// ── Tier metadata ─────────────────────────────────────────────────────────────
const TIERS: Record<string, { label: string; usd: string; zar: string; period: string; isPromo: boolean }> = {
  "PROMOTIONAL (Base + Free 2 Months)": {
    label: "Promotional — Limited Time Offer",
    usd: "$3,000 flat",
    zar: "R60,000 flat",
    period: "90 days total (30-day build · 60 days support FREE)",
    isPromo: true,
  },
  Premium: {
    label: "Premium",
    usd: "$5,000 flat",
    zar: "R100,000 flat",
    period: "120 days total (30-day build · 60 days support · +30 days FREE)",
    isPromo: false,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: Date) {
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

function safeName(company: string) {
  return `proposal-${(company || "client").replace(/[^a-z0-9]/gi, "-").slice(0, 40).toLowerCase()}`;
}

// ── PDF generation ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  const currency: "USD" | "ZAR" = b.currency === "ZAR" ? "ZAR" : "USD";
  const tier: string = b.tier || "Premium";
  const pkg = TIERS[tier] ?? TIERS.Premium;
  const price = currency === "ZAR" ? pkg.zar : pkg.usd;

  const refNo = `SL-${Date.now().toString().slice(-8)}`;
  const today  = fmt(new Date());
  const expiry = fmt(new Date(Date.now() + 14 * 864e5));

  const pdf = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      bufferPages: true,
      info: {
        Title: "Service Proposal — The Startup",
        Author: "The Startup",
        Subject: `Scope Lock Agreement — ${b.company || "Client"}`,
        Creator: "The Startup Platform",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W  = doc.page.width;   // 595.28
    const H  = doc.page.height;  // 841.89
    const ML = 55;               // left margin
    const CW = W - ML * 2;      // content width

    // ── Section title helper ────────────────────────────────────────────────
    const sectionTitle = (title: string) => {
      if (doc.y > 700) doc.addPage();
      doc.moveDown(0.8);
      doc.rect(ML, doc.y, 3, 13).fill(C.teal);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(C.dark)
        .text(title.toUpperCase(), ML + 10, doc.y + 1, { characterSpacing: 0.5, width: CW - 10 });
      doc.moveDown(0.25);
      doc.rect(ML, doc.y, CW, 0.5).fill(C.border);
      doc.moveDown(0.65);
    };

    // ── Labeled field helper ────────────────────────────────────────────────
    const field = (label: string, value: string | undefined) => {
      if (!value?.trim()) return;
      if (doc.y > 710) doc.addPage();
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor(C.light)
        .text(label.toUpperCase(), ML, doc.y, { characterSpacing: 0.4, width: CW });
      doc.fontSize(9).font("Helvetica").fillColor(C.dark)
        .text(value, ML, doc.y, { width: CW });
      doc.moveDown(0.55);
    };

    // ── Three-column row helper ─────────────────────────────────────────────
    const triRow = (
      col1: string, col2: string, col3: string,
      w1: number, w2: number,
      bold1 = false, tealCol2 = false
    ) => {
      if (doc.y > 715) doc.addPage();
      const ry = doc.y;
      const x2 = ML + w1 + 8;
      const x3 = x2 + w2 + 8;
      const w3 = CW - w1 - w2 - 16;

      doc.fontSize(9).font(bold1 ? "Helvetica-Bold" : "Helvetica").fillColor(C.dark)
        .text(col1, ML, ry, { width: w1 });
      const y1 = doc.y;

      doc.fontSize(9).font("Helvetica-Bold").fillColor(tealCol2 ? C.teal : C.mid)
        .text(col2, x2, ry, { width: w2, align: "right" });
      const y2 = doc.y;

      doc.fontSize(8).font("Helvetica").fillColor(C.light)
        .text(col3, x3, ry, { width: w3 });
      const y3 = doc.y;

      doc.y = Math.max(y1, y2, y3) + 4;
    };

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 88).fill(C.dark);
    doc.rect(0, 88, W, 3).fill(C.teal);

    // Logo
    doc.fontSize(6.5).font("Helvetica").fillColor(C.teal)
      .text("THE", ML, 20, { characterSpacing: 3.5 });
    doc.fontSize(21).font("Helvetica-Bold").fillColor(C.white)
      .text("STARTUP", ML, 28);
    doc.fontSize(8.5).font("Helvetica").fillColor(C.light)
      .text("Service Proposal & Scope Lock Agreement", ML, 68);

    // Right: ref + dates
    doc.fontSize(7.5).font("Helvetica").fillColor(C.light)
      .text(`Reference: ${refNo}`,   ML, 20, { width: CW, align: "right" });
    doc.fontSize(7.5).fillColor(C.light)
      .text(`Issued: ${today}`,      ML, 33, { width: CW, align: "right" });
    doc.fontSize(7.5).fillColor(C.light)
      .text(`Valid until: ${expiry}`,ML, 46, { width: CW, align: "right" });

    doc.y = 106;

    // ── PROPOSAL INFO BAR ────────────────────────────────────────────────────
    const barY = doc.y;
    doc.rect(ML, barY, CW, 54).fill(C.tealL);
    doc.rect(ML, barY, 4, 54).fill(C.teal);

    doc.fontSize(7).font("Helvetica-Bold").fillColor(C.tealD)
      .text("PREPARED FOR", ML + 12, barY + 9, { characterSpacing: 0.5 });
    doc.fontSize(15).font("Helvetica-Bold").fillColor(C.dark)
      .text(b.company || "Your Organisation", ML + 12, barY + 19);
    const contactLine = [b.contact, b.email].filter(Boolean).join("   ·   ");
    doc.fontSize(8).font("Helvetica").fillColor(C.mid)
      .text(contactLine, ML + 12, barY + 38);

    doc.y = barY + 62;

    // ── CLIENT INFORMATION ───────────────────────────────────────────────────
    sectionTitle("Client Information");
    field("Company / Organisation", b.company);
    field("Contact Name", b.contact);
    field("Email Address", b.email);
    field("Preferred Currency", currency);

    // ── SELECTED PACKAGE ─────────────────────────────────────────────────────
    sectionTitle("Selected Package");

    const pkgY = doc.y;
    doc.rect(ML, pkgY, CW, 76).fill(C.dark);
    doc.rect(ML, pkgY, 4, 76).fill(C.teal);

    doc.fontSize(8).font("Helvetica-Bold").fillColor(C.teal)
      .text(pkg.label.toUpperCase(), ML + 12, pkgY + 11, { characterSpacing: 0.4 });
    doc.fontSize(23).font("Helvetica-Bold").fillColor(C.white)
      .text(price, ML + 12, pkgY + 23);
    doc.fontSize(8).font("Helvetica").fillColor(C.light)
      .text(pkg.period, ML + 12, pkgY + 52);

    const featureLine = pkg.isPromo
      ? "30-day build   ·   60 days support FREE   ·   Full handover documentation"
      : "30-day build   ·   60 days support   ·   +30 days FREE   ·   Full handover documentation";
    doc.fontSize(7.5).font("Helvetica").fillColor(C.teal)
      .text(featureLine, ML + 12, pkgY + 64, { width: CW - 24 });

    doc.y = pkgY + 84;

    // ── PROJECT SCOPE ─────────────────────────────────────────────────────────
    sectionTitle("Project Scope (as submitted)");
    field("Business Objective / Outcome Sought", b.goal);
    field("Current Bottleneck", b.bottleneck);
    field("Core Workflow to Build", b.workflow);
    field("Must-Have Features", b.musthaves);
    field("Required Integrations", b.integrations || "Not specified");
    field("Proposed Start Date", b.startDate || "To be confirmed");

    // ── WHAT'S INCLUDED ───────────────────────────────────────────────────────
    sectionTitle("What's Included in Your Build");

    const deliverables = [
      "One core workflow built end-to-end (capture → score → route → report)",
      "CRM board your team already knows how to use on day one",
      "One reporting dashboard with the metrics leadership actually watches",
      "One third-party integration (your CRM, enrichment tool, or calendar)",
      "Team training session, recorded and yours to keep",
      "Full handover documentation — you own the system completely",
    ];

    deliverables.forEach(item => {
      if (doc.y > 720) doc.addPage();
      const iy = doc.y;
      doc.rect(ML, iy + 4, 4, 4).fill(C.teal);
      doc.fontSize(9).font("Helvetica").fillColor(C.mid)
        .text(item, ML + 11, iy, { width: CW - 11 });
      doc.moveDown(0.25);
    });

    // ── TIMELINE ──────────────────────────────────────────────────────────────
    sectionTitle("Project Timeline");

    type Phase = [string, string, string, boolean];
    const phases: Phase[] = [
      ["Build Phase",    "Day 1–30",                         "System scoped, configured, tested, and delivered to your team",       false],
      ["Support Phase",  pkg.isPromo ? "Day 31–90" : "Day 31–90",  "Active support: training, optimisation, bug fixes, and assistance",  false],
      ...(!pkg.isPromo ? [["Free Support Extension", "Day 91–120", "30 additional days of support at no charge", false] as Phase] : []),
      ["Total Engagement", `${pkg.isPromo ? 90 : 120} days`, "From signed agreement through to end of support period",             true],
    ];

    const pw1 = CW * 0.36;
    const pw2 = CW * 0.2;

    phases.forEach(([phase, period, note, isFinal]) => {
      if (doc.y > 710) doc.addPage();
      const py = doc.y;
      if (isFinal) {
        doc.rect(ML, py - 3, CW, 22).fill(C.tealL);
        doc.rect(ML, py - 3, 3, 22).fill(C.teal);
      }
      triRow(phase, period, note, pw1, pw2, isFinal, isFinal);
    });

    // ── INVESTMENT ────────────────────────────────────────────────────────────
    sectionTitle("Investment Summary");

    type IRow = [string, string, string];
    const invRows: IRow[] = pkg.isPromo
      ? [["Total — all-in, fixed price", price, "Full payment due on signature to initiate build"]]
      : [
          ["First Payment — 50%",  currency === "ZAR" ? "R50,000" : "$2,500", "Due on signature to initiate the build"],
          ["Final Payment — 50%",  currency === "ZAR" ? "R50,000" : "$2,500", "Due on system handover"],
          ["Total Investment",      price,                                       "Fixed price — no overruns, no hidden fees"],
        ];

    const iw1 = CW * 0.44;
    const iw2 = CW * 0.2;

    invRows.forEach(([item, amount, note]) => {
      if (doc.y > 710) doc.addPage();
      triRow(item, amount, note, iw1, iw2, false, true);
    });

    // ── TERMS & CONDITIONS ────────────────────────────────────────────────────
    if (doc.y > 540) doc.addPage();
    sectionTitle("Terms & Conditions");

    const tcs: [string, string][] = [
      ["1. Scope & Agreement",
        "This document constitutes a binding service proposal between The Startup (service provider) and the client named herein. The scope of work is limited to what is described in this document. Changes or additions require written amendment and may affect the timeline and price."],
      ["2. 30-Day Build Guarantee",
        "The Startup commits to delivering a working system within 30 calendar days of the confirmed build start date. If this deadline is missed for reasons attributable solely to The Startup, the client receives an additional 30 days of support at no cost. The build clock starts on the date the signed agreement and first payment are received."],
      ["3. Payment Terms",
        "Promotional tier: full payment is due on signature. Premium tier: 50% is due on signature to initiate the build; the remaining 50% is due on system handover. All invoices are payable within 5 business days of issue. Overdue payments may result in the build being paused until payment is received."],
      ["4. Ownership of Deliverables",
        "Upon receipt of final payment, all custom configurations, automations, dashboards, workflows, and documentation built under this agreement become the client's sole property. The Startup retains rights to its reusable internal frameworks, methodologies, and tooling that are not specific to the client's build."],
      ["5. Support Period",
        "The support period begins on the handover date and covers active system support, bug fixes, performance optimisation, and training as specified in the selected tier. Support does not include the development of new features or workflows not defined in this scope document."],
      ["6. Confidentiality",
        "Both parties agree to treat all project details, business information, financial data, and proprietary processes as strictly confidential. Neither party will disclose this information to third parties without prior written consent from the other party."],
      ["7. Cancellation Policy",
        "Cancellation before build commencement: full refund minus a 10% scoping and administration fee. Cancellation after build has commenced: the initial deposit (50%) is non-refundable. Completed work will be invoiced at a pro-rata day rate, deducted from any balance held."],
      ["8. Limitation of Liability",
        "The Startup's total liability under this agreement is limited to the total fees paid by the client. The Startup is not liable for any indirect, consequential, incidental, or punitive damages arising from the use or inability to use the delivered system."],
      ["9. Force Majeure",
        "Neither party shall be liable for delays or failure to perform obligations caused by circumstances beyond their reasonable control, including but not limited to natural disasters, government actions, platform outages, or critical infrastructure failure."],
      ["10. Governing Law",
        "This agreement is governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes arising from or related to this agreement shall be subject to the exclusive jurisdiction of the South African courts."],
    ];

    tcs.forEach(([title, body]) => {
      if (doc.y > 695) doc.addPage();
      doc.fontSize(8).font("Helvetica-Bold").fillColor(C.dark)
        .text(title, ML, doc.y, { width: CW });
      doc.fontSize(7.5).font("Helvetica").fillColor(C.mid)
        .text(body, ML, doc.y, { width: CW });
      doc.moveDown(0.5);
    });

    // ── PAYMENT METHODS ───────────────────────────────────────────────────────
    sectionTitle("Payment Methods");

    [
      ["EFT / Bank Transfer",
       "Banking details are provided on your invoice (Capitec / Standard Bank). Please reference your proposal number when making payment."],
      ["Credit / Debit Card",
       "A secure payment link is sent with your invoice (Stripe for international clients; PayFast for South African clients)."],
      ["PayPal / Wise",
       "Available for international clients. USD pricing applies. Payment link provided on confirmation of your scope."],
      ["Cryptocurrency",
       "BTC, ETH, or USDC accepted on request. Wallet address and instructions provided after scope confirmation."],
    ].forEach(([method, detail]) => {
      if (doc.y > 715) doc.addPage();
      const my = doc.y;
      doc.rect(ML, my + 3, 5, 5).fill(C.teal);
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(C.dark)
        .text(method, ML + 12, my, { width: CW - 12 });
      doc.fontSize(8).font("Helvetica").fillColor(C.mid)
        .text(detail, ML + 12, doc.y, { width: CW - 12 });
      doc.moveDown(0.4);
    });

    // ── ACKNOWLEDGEMENT ───────────────────────────────────────────────────────
    if (doc.y > 550) doc.addPage();
    sectionTitle("Client Acknowledgement");

    doc.fontSize(9).font("Helvetica").fillColor(C.mid)
      .text(
        "By signing below, the client confirms and agrees to each of the following statements:",
        ML, doc.y, { width: CW }
      );
    doc.moveDown(0.7);

    const acks = [
      "The information provided in the Scope Lock form is accurate and complete to the best of my knowledge.",
      "I have read and understood the Terms & Conditions stated in this document.",
      "I agree to the investment amount, payment schedule, and pricing as outlined in this proposal.",
      "I understand this agreement becomes legally binding upon my signature and receipt of initial payment.",
    ];

    acks.forEach(ack => {
      if (doc.y > 710) doc.addPage();
      const ay = doc.y;
      doc.rect(ML, ay + 1.5, 9, 9).lineWidth(0.75).stroke(C.mid);
      doc.fontSize(9).font("Helvetica").fillColor(C.dark)
        .text(ack, ML + 16, ay, { width: CW - 16 });
      doc.moveDown(0.65);
    });

    // ── SIGNATURE BLOCKS ──────────────────────────────────────────────────────
    if (doc.y > 590) doc.addPage();
    doc.moveDown(1.2);

    const sigY   = doc.y;
    const half   = (CW - 24) / 2;
    const rX     = ML + half + 24;

    const sigLine = (x: number, y: number, label: string, width = half) => {
      doc.moveTo(x, y).lineTo(x + width, y).lineWidth(0.5).stroke(C.border);
      doc.fontSize(7).font("Helvetica").fillColor(C.light).text(label, x, y + 3, { width });
    };

    // Column headers
    doc.fontSize(8).font("Helvetica-Bold").fillColor(C.dark)
      .text("CLIENT SIGNATURE", ML, sigY, { width: half });
    doc.fontSize(8).font("Helvetica-Bold").fillColor(C.dark)
      .text("AUTHORISED BY — THE STARTUP", rX, sigY, { width: half });

    const l1 = sigY + 22;
    const l2 = l1 + 38;
    const l3 = l2 + 30;
    const l4 = l3 + 30;

    // Client sig lines
    sigLine(ML, l1, "Signature");
    sigLine(ML, l2, "Full Name (Printed)");
    sigLine(ML, l3, "Title / Position");
    sigLine(ML, l4, "Date");

    // Startup sig lines
    sigLine(rX, l1, "Authorised Signature");
    sigLine(rX, l2, "Full Name (Printed)");
    sigLine(rX, l3, "Date");

    // Company stamp box
    doc.rect(rX + half - 76, l3 + 15, 72, 44)
      .lineWidth(0.5).dash(3, { space: 2 }).stroke(C.border);
    doc.undash();
    doc.fontSize(7).font("Helvetica").fillColor(C.light)
      .text("Company Stamp", rX + half - 76, l3 + 32, { width: 72, align: "center" });

    // ── FOOTER ON ALL PAGES ───────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.rect(0, H - 26, W, 26).fill(C.dark);
      doc.fontSize(7).font("Helvetica").fillColor(C.light)
        .text(`The Startup  ·  ${refNo}  ·  Confidential`, ML, H - 15, { width: CW / 2 });
      doc.fontSize(7).font("Helvetica").fillColor(C.light)
        .text(`Page ${i + 1} of ${range.count}`, ML, H - 15, { width: CW, align: "right" });
    }

    doc.end();
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName(b.company)}.pdf"`,
    },
  });
}
