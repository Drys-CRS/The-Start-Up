import { NextRequest, NextResponse } from "next/server";
import { resolveScopeLock } from "@/lib/monday";
import { isDepositPaid, paymentUrl } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "checkout", 10, 60_000);
  if (limited) return limited;

  const { ref, item, email, paymentType = "deposit" } = await req.json().catch(() => ({}));

  // Identity and price both come from the Monday record, never the request, so a
  // customer can't pay against someone else's item or edit ?t= down to a cheaper tier.
  const record = await resolveScopeLock({ ref, item, email });
  if (!record) {
    return NextResponse.json(
      { error: "We couldn't find an agreement matching that reference and email." },
      { status: 404 },
    );
  }

  if (paymentType === "deposit" && isDepositPaid(record.stageLabel)) {
    return NextResponse.json(
      { error: "The deposit for this agreement has already been paid." },
      { status: 409 },
    );
  }

  const url = paymentUrl(record, paymentType);
  if (!url) {
    return NextResponse.json(
      { error: "No payment option is set up for this agreement — please contact us." },
      { status: 400 },
    );
  }

  return NextResponse.json({ url });
}
