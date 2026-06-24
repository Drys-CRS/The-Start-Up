import { NextRequest, NextResponse } from "next/server";
import { addFileToItem } from "@/lib/monday";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const item = (form.get("item") as string) || "";
  const ref  = (form.get("ref")  as string) || "unknown";

  if (!file || !item) {
    return NextResponse.json({ error: "file and item are required" }, { status: 400 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const filename = `signed-proposal-${ref}.pdf`;

  await addFileToItem(
    item,
    buffer,
    filename,
    `Signed proposal received from client — ref ${ref}`,
  );

  return NextResponse.json({ ok: true });
}
