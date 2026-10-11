"use server";

import { revalidatePath } from "next/cache";
import { archiveStripe, describeProduct, type StaleItem } from "@/lib/stripe-admin";

export type ActionResult = { ok: boolean; message: string };

export async function archiveSelected(items: { kind: StaleItem["kind"]; id: string }[]): Promise<ActionResult> {
  if (!items?.length) return { ok: false, message: "Nothing selected." };

  const result = await archiveStripe(items);
  revalidatePath("/admin/stripe");

  if (result.failed.length) {
    return {
      ok: result.archived > 0,
      message: `Archived ${result.archived}. ${result.failed.length} failed: ${result.failed
        .map(f => `${f.id} (${f.error})`)
        .join("; ")
        .slice(0, 300)}`,
    };
  }
  return { ok: true, message: `Archived ${result.archived} item${result.archived === 1 ? "" : "s"}.` };
}

export async function rewriteDescription(id: string, description: string): Promise<ActionResult> {
  const text = (description || "").trim();
  if (!text) return { ok: false, message: "Write a description first." };

  const res = await describeProduct(id, text);
  revalidatePath("/admin/stripe");
  return res.ok
    ? { ok: true, message: "Description updated." }
    : { ok: false, message: res.error || "Stripe rejected that." };
}
