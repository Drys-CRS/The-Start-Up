import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const cur = b.currency === "ZAR" ? "R" : "$";
  const money = (n: number) => cur + Math.round(n || 0).toLocaleString("en-US");

  const prompt = `You are a senior revenue-operations consultant at "The Start Up", a firm that ships custom CRM lead-generation systems in 30 days. Write a sharp, personalized "Bottleneck Report" for a prospect who just ran our lead-leakage calculator.

Prospect:
- Company: ${b.company || "the company"}
- Industry: ${b.industry || "B2B"}
- Monthly inbound leads: ${b.leads ?? 0}
- Average deal value: ${cur}${b.deal ?? 0}
- Current close rate: ${b.closeRate ?? 0}%
- Average lead response time: ${b.responseTime || "unknown"}

PRE-CALCULATED figures — use EXACTLY, never invent or recompute:
- Recoverable deals per month: ${Math.round(b.dealsPerMonth || 0)}
- Estimated monthly revenue leak: ${money(b.monthlyLeak)}
- Estimated annual revenue leak: ${money(b.annualLeak)}

Respond with ONLY valid JSON, no markdown fences, no preamble:
{
  "diagnosis": "2-3 sentences, specific to their industry and response time",
  "recommendations": ["three tactical fixes referencing real mechanics (response SLAs, automated routing, lead scoring, follow-up sequences)"],
  "roi": "1-2 sentences referencing the annual leak figure",
  "closingLine": "1 sentence inviting them to see how a custom CRM lead system plugs this in 30 days"
}
Be concrete, non-generic, no flattery.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
        "HTTP-Referer": "https://the-start-up.app",
        "X-Title": "CRS Lead Gen AI Cascade Stack",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "Report service unavailable" }, { status: 502 });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const report = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
    return NextResponse.json({ report });
  } catch (e) {
    return NextResponse.json({ error: "Could not generate report" }, { status: 500 });
  }
}
