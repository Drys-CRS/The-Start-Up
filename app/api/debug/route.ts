import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.MONDAY_API_TOKEN || "";
  const openRouterKey = process.env.OPENROUTER_API_KEY || "";

  // Test Monday.com with current token
  let mondayStatus = "not tested";
  let mondayError = "";
  if (token) {
    try {
      const res = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          "API-Version": "2024-10",
        },
        body: JSON.stringify({ query: "{ me { id name } }" }),
      });
      const data = await res.json();
      mondayStatus = data?.data?.me?.name ? `OK — ${data.data.me.name}` : `error: ${JSON.stringify(data)}`;
    } catch (e: any) {
      mondayStatus = "fetch failed";
      mondayError = String(e?.message || e);
    }
  }

  return NextResponse.json({
    monday: {
      tokenPresent: !!token,
      tokenLength: token.length,
      tokenPreview: token ? `${token.slice(0, 4)}…${token.slice(-4)}` : "MISSING",
      apiStatus: mondayStatus,
      apiError: mondayError || undefined,
    },
    openRouter: {
      keyPresent: !!openRouterKey,
      keyLength: openRouterKey.length,
      keyPreview: openRouterKey ? `${openRouterKey.slice(0, 6)}…${openRouterKey.slice(-4)}` : "MISSING",
    },
    nodeEnv: process.env.NODE_ENV,
  });
}
