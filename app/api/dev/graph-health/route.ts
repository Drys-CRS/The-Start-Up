import { NextResponse } from "next/server";
import { graphHealth } from "@/lib/graph";
import { getMailSyncState } from "@/lib/db";

export const runtime = "nodejs";

// Quick check that the Entra app registration works and can actually see the
// support mailbox. Open it in a browser after setting MS_TENANT_ID, MS_CLIENT_ID and
// MS_CLIENT_SECRET; it's under /api/dev, so the admin password protects it.
//
// A 403 from Graph usually means the Exchange Application Access Policy hasn't taken
// effect yet — Microsoft warns that can take over an hour.
export async function GET() {
  const health = await graphHealth();
  const [inbox, sent] = await Promise.all([getMailSyncState("inbox"), getMailSyncState("sentitems")]);

  return NextResponse.json({
    ...health,
    sync: {
      inbox: inbox?.delta_link ? "has a delta cursor" : "never synced",
      sentitems: sent?.delta_link ? "has a delta cursor" : "never synced",
    },
  }, { status: health.ok ? 200 : 503 });
}
