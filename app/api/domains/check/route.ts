import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Capture-intent only: this route checks domain availability + price via GoDaddy so a
// client can pick a domain to register as part of their build. It does NOT purchase or
// charge anything — the team registers the chosen domain during onboarding.
//
// Auth: GoDaddy "sso-key KEY:SECRET". Provide the pair via env:
//   GODADDY_API_KEY / GODADDY_API_SECRET   (preferred)
// Back-compat: GoDaddy_API_KEY is also read for the key. If a value already contains a
// colon it is treated as a full "KEY:SECRET" pair.
const RAW_KEY = process.env.GODADDY_API_KEY || process.env.GoDaddy_API_KEY || "";
const SECRET = process.env.GODADDY_API_SECRET || process.env.GoDaddy_API_SECRET || "";
const API_BASE = process.env.GODADDY_API_BASE || "https://api.godaddy.com";

// Common TLDs offered when the user types a bare name (or to suggest alternatives).
const DEFAULT_TLDS = ["com", "co", "io", "app", "net"];
const MAX_CANDIDATES = 6;

function ssoKeyHeader(): string | null {
  if (RAW_KEY.includes(":")) return `sso-key ${RAW_KEY}`; // already KEY:SECRET
  if (RAW_KEY && SECRET) return `sso-key ${RAW_KEY}:${SECRET}`;
  return null;
}

// Normalise a user string to a bare "name" and optional "tld".
function parseInput(raw: string): { sld: string; tld: string | null } {
  let s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "");
  // strip a leading "www."
  s = s.replace(/^www\./, "");
  if (!s) return { sld: "", tld: null };
  const dot = s.indexOf(".");
  if (dot === -1) return { sld: s.replace(/[^a-z0-9-]/g, ""), tld: null };
  const sld = s.slice(0, dot).replace(/[^a-z0-9-]/g, "");
  const tld = s.slice(dot + 1).replace(/[^a-z0-9.]/g, "");
  return { sld, tld: tld || null };
}

function buildCandidates(sld: string, tld: string | null): string[] {
  if (!sld) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (d: string) => {
    if (d && !seen.has(d)) { seen.add(d); out.push(d); }
  };
  if (tld) add(`${sld}.${tld}`);
  for (const t of DEFAULT_TLDS) add(`${sld}.${t}`);
  return out.slice(0, MAX_CANDIDATES);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sld, tld } = parseInput(body?.domain);
  if (!sld) {
    return NextResponse.json({ error: "Enter a domain name to check." }, { status: 400 });
  }

  const auth = ssoKeyHeader();
  if (!auth) {
    // Missing secret is the common case here — surface it clearly for setup.
    return NextResponse.json(
      { error: "Domain lookup isn't configured yet. Add GODADDY_API_KEY and GODADDY_API_SECRET to the environment." },
      { status: 503 },
    );
  }

  const candidates = buildCandidates(sld, tld);

  try {
    const res = await fetch(`${API_BASE}/v1/domains/available?checkType=FAST`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(candidates),
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const status = res.status === 401 || res.status === 403 ? 502 : 502;
      return NextResponse.json(
        { error: "Domain lookup is temporarily unavailable.", detail: detail.slice(0, 300) },
        { status },
      );
    }

    const data = await res.json().catch(() => ({}));
    const rows: any[] = Array.isArray(data?.domains) ? data.domains : [];

    // GoDaddy returns price in currency micro-units (÷ 1,000,000). Period is in years.
    const results = rows.map((r) => {
      const currency = r.currency || "USD";
      const priceNum = typeof r.price === "number" ? r.price / 1_000_000 : null;
      return {
        domain: r.domain,
        available: !!r.available,
        currency,
        price: priceNum,
        period: r.period || 1,
        priceLabel:
          priceNum != null
            ? `${currency === "USD" ? "$" : ""}${priceNum.toFixed(2)}${currency !== "USD" ? " " + currency : ""}/yr`
            : null,
      };
    });

    // Available first, then by price ascending.
    results.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      return (a.price ?? Infinity) - (b.price ?? Infinity);
    });

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Could not reach the domain registrar.", detail: String(e?.message || e).slice(0, 300) },
      { status: 502 },
    );
  }
}
