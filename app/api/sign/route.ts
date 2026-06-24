import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, PageSizes, rgb } from "pdf-lib";
import { addFileToItem, addUpdateToItem, changeItemStage } from "@/lib/monday";

export const runtime = "nodejs";

// ── Helpers ────────────────────────────────────────────────────────────────────
function c(hex: string) {
  return rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
}

function wordWrap(text: string, widthOf: (s: string) => number, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (widthOf(test) <= maxW) { line = test; }
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

// ── Certificate PDF ────────────────────────────────────────────────────────────
async function buildCertPDF(opts: {
  ref: string; name: string; signedAt: string; sigDataUrl: string;
  tier?: string; cur?: string;
}): Promise<Uint8Array> {
  const { ref, name, signedAt, sigDataUrl } = opts;

  const DARK  = c("#0f172a");
  const TEAL  = c("#14b8a6");
  const MID   = c("#475569");
  const LIGHT = c("#94a3b8");
  const WHITE = rgb(1, 1, 1);
  const SOFT  = c("#f8fafc");
  const BORDER = c("#e2e8f0");

  const doc   = await PDFDocument.create();
  const fontR = await doc.embedStandardFont(StandardFonts.Helvetica);
  const fontB = await doc.embedStandardFont(StandardFonts.HelveticaBold);

  const [W, H] = PageSizes.A4;
  const ML = 60;
  const CW = W - ML * 2;

  const page = doc.addPage(PageSizes.A4);
  let cy = H;

  function dt(str: string, x: number, y: number, font: typeof fontR, size: number, color: ReturnType<typeof rgb>) {
    page.drawText(str, { x, y, font, size, color });
  }
  function line(y: number, col: ReturnType<typeof rgb> = BORDER, t = 0.5) {
    page.drawLine({ start: { x: ML, y }, end: { x: ML + CW, y }, color: col, thickness: t });
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: cy - 72, width: W, height: 72, color: DARK });
  page.drawRectangle({ x: 0, y: cy - 75, width: W, height: 3,  color: TEAL });
  dt("THE STARTUP",                       ML, cy - 24, fontB, 16, WHITE);
  dt("Digital Signature Certificate",     ML, cy - 46, fontR, 10, LIGHT);
  const ts = `Issued: ${new Date(signedAt).toUTCString()}`;
  dt(ts, W - ML - fontR.widthOfTextAtSize(ts, 8), cy - 46, fontR, 8, LIGHT);
  cy -= 96;

  // ── Document reference ──────────────────────────────────────────────────────
  dt("DOCUMENT SIGNED", ML, cy, fontB, 8, LIGHT);
  cy -= 14;
  dt("Scope Lock Agreement & Service Proposal", ML, cy, fontB, 14, DARK);
  cy -= 28;
  line(cy);
  cy -= 22;

  // ── Signatory details ───────────────────────────────────────────────────────
  function detailRow(label: string, value: string) {
    dt(label, ML, cy, fontB, 8, LIGHT);
    cy -= 14;
    dt(value, ML, cy, fontR, 11, DARK);
    cy -= 24;
  }
  detailRow("REFERENCE NUMBER", ref || "—");
  detailRow("SIGNATORY NAME",   name);
  detailRow("SIGNED ON",
    new Date(signedAt).toLocaleString("en-ZA", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    }),
  );
  line(cy);
  cy -= 22;

  // ── Signature image ─────────────────────────────────────────────────────────
  dt("DIGITAL SIGNATURE", ML, cy, fontB, 8, LIGHT);
  cy -= 16;

  const base64 = sigDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const sigImg  = await doc.embedPng(Buffer.from(base64, "base64"));
  const { width: iw, height: ih } = sigImg.scale(1);
  const maxSW = CW, maxSH = 120;
  const scale  = Math.min(maxSW / iw, maxSH / ih, 1);
  const dw = iw * scale, dh = ih * scale;

  page.drawRectangle({ x: ML, y: cy - dh - 12, width: CW, height: dh + 12, color: SOFT });
  page.drawRectangle({ x: ML, y: cy - dh - 12, width: CW, height: dh + 12, borderColor: BORDER, borderWidth: 0.5 });
  page.drawImage(sigImg, { x: ML + 10, y: cy - dh - 4, width: dw, height: dh });
  cy -= dh + 28;

  line(cy);
  cy -= 22;

  // ── Agreement text ──────────────────────────────────────────────────────────
  dt("AGREEMENT CONFIRMATION", ML, cy, fontB, 8, LIGHT);
  cy -= 16;
  const ackLines = wordWrap(
    `${name} confirms that they have reviewed and understood the full Service Proposal and Scope Lock Agreement referenced above (${ref}), and agrees to all terms and conditions therein, including the investment amount, payment schedule, timeline, scope of work, confidentiality obligations, and ownership terms.`,
    s => fontR.widthOfTextAtSize(s, 9),
    CW,
  );
  ackLines.forEach(l => { dt(l, ML, cy, fontR, 9, MID); cy -= 13; });
  cy -= 10;
  line(cy);
  cy -= 18;

  // ── Legal notice ────────────────────────────────────────────────────────────
  const legalLines = wordWrap(
    "This digital signature is legally binding under the Electronic Communications and Transactions Act 25 of 2002 (Republic of South Africa). The timestamp and signatory data are recorded and stored securely. Modification of this certificate after signing invalidates the agreement.",
    s => fontR.widthOfTextAtSize(s, 7.5),
    CW,
  );
  legalLines.forEach(l => { dt(l, ML, cy, fontR, 7.5, LIGHT); cy -= 10; });

  // ── Footer ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: 24, color: DARK });
  dt(`The Startup  -  ${ref}  -  Digital Signature Certificate`, ML, 8, fontR, 7, LIGHT);

  return doc.save();
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { ref, item, name, sigDataUrl, tier, cur } = await req.json().catch(() => ({}));

  if (!name || !sigDataUrl || !item) {
    return NextResponse.json({ error: "name, sigDataUrl and item are required" }, { status: 400 });
  }

  const signedAt = new Date().toISOString();

  // Generate signature certificate PDF
  const certBytes = await buildCertPDF({ ref, name, signedAt, sigDataUrl, tier, cur });

  // Fire off Monday.com updates concurrently (errors are swallowed — don't block the response)
  await Promise.allSettled([
    addFileToItem(
      item,
      Buffer.from(certBytes),
      `signature-cert-${ref || Date.now()}.pdf`,
      `Digital agreement signed by ${name} on ${new Date(signedAt).toLocaleString("en-ZA")}. Ref: ${ref}`,
    ),
    addUpdateToItem(
      item,
      `<strong>Agreement signed digitally</strong><br>Signatory: ${name}<br>Reference: ${ref}<br>Timestamp: ${new Date(signedAt).toUTCString()}`,
    ),
    changeItemStage(item, "Signed"),
  ]);

  return NextResponse.json({ ok: true, signedAt });
}
