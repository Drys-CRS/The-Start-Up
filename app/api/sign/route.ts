import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, PageSizes, rgb } from "pdf-lib";
import { SCOPE_BOARD_ID, addFileToItem, addUpdateToItem, changeItemStage, resolveScopeLock } from "@/lib/monday";
import { rateLimit } from "@/lib/rate-limit";
import { sendStatusEmail, sendTeamAlert } from "@/lib/email";
import { mondayBoardUrl } from "@/lib/links";

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
// The sign page's typed-name canvas (500×110 PNG) encodes to a few KB.
const MAX_SIG_DATA_URL = 300_000;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "sign", 10, 60_000);
  if (limited) return limited;

  const { ref, item, name: rawName, sigDataUrl, tier, cur, email } = await req.json().catch(() => ({}));
  const name = typeof rawName === "string" ? rawName.trim().slice(0, 120) : "";

  if (
    !name ||
    typeof sigDataUrl !== "string" ||
    !sigDataUrl.startsWith("data:image/png;base64,") ||
    sigDataUrl.length > MAX_SIG_DATA_URL
  ) {
    return NextResponse.json({ error: "A name and signature are required" }, { status: 400 });
  }

  // Only the owner of a Scope Lock can sign it: the ref/item from their link must
  // resolve to a real item whose stored email matches.
  const record = await resolveScopeLock({ ref, item, email });
  if (!record) {
    return NextResponse.json(
      { error: "We couldn't find an agreement matching this link. Please reopen the signing link from your Build Plan." },
      { status: 404 },
    );
  }

  const refNo = (record.ref || (typeof ref === "string" ? ref : "")).replace(/[^\w-]/g, "").slice(0, 40);
  const safeName = escapeHtml(name);
  const signedAt = new Date().toISOString();

  // Generate signature certificate PDF (optional — swallow errors)
  let certBytes: Uint8Array | null = null;
  try {
    certBytes = await buildCertPDF({ ref: refNo, name, signedAt, sigDataUrl, tier, cur });
  } catch {
    // cert generation failed — proceed without it
  }

  await Promise.allSettled([
    certBytes
      ? addFileToItem(
          record.itemId,
          Buffer.from(certBytes),
          `signature-cert-${refNo || Date.now()}.pdf`,
          `Digital agreement signed by ${safeName} on ${new Date(signedAt).toLocaleString("en-ZA")}. Ref: ${refNo}`,
        )
      : Promise.resolve(),
    addUpdateToItem(
      record.itemId,
      `<strong>Agreement signed digitally</strong><br>Signatory: ${safeName}<br>Reference: ${refNo}<br>Timestamp: ${new Date(signedAt).toUTCString()}`,
    ),
    changeItemStage(record.itemId, "Signed"),
  ]);

  // Status email to the signer and a team alert — neither fails the sign response.
  await Promise.allSettled([
    sendStatusEmail({ to: record.email, stageLabel: "Signed", ref: refNo }),
    sendTeamAlert({
      subject: `Agreement signed${refNo ? `: ${refNo}` : ""}`,
      heading: "An agreement was just signed",
      rows: [
        ["Signatory", name],
        ["Email", record.email],
        ["Reference", refNo],
        ["Scope Lock item", record.itemId],
      ],
      link: { label: "Open Scope Locks board", url: mondayBoardUrl(SCOPE_BOARD_ID) },
    }),
  ]);

  return NextResponse.json({ ok: true, signedAt });
}
