import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getScopeStatus } from "@/lib/monday";
import { stageMeta } from "@/lib/status";

export const runtime = "nodejs";

// Public status lookup. Requires BOTH a ref and a matching email so status
// isn't enumerable by email (or ref) alone. Returns a generic 404 on any
// mismatch — never reveals which of the two was wrong.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "status", 10, 60_000);
  if (limited) return limited;

  const { ref, email } = await req.json().catch(() => ({}));

  if (!ref || !email || typeof ref !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "A reference number and email are required." }, { status: 400 });
  }

  const NOT_FOUND = NextResponse.json(
    { error: "We couldn't find an order matching that reference and email." },
    { status: 404 },
  );

  let record;
  try {
    record = await getScopeStatus(ref.trim());
  } catch {
    return NOT_FOUND;
  }

  if (!record || record.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return NOT_FOUND;
  }

  const meta = stageMeta(record.stageLabel);
  return NextResponse.json({
    ok: true,
    ref: record.ref || ref.trim(),
    stageLabel: record.stageLabel,
    ...meta,
  });
}
