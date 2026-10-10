"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Circle, Loader2, LogOut, PenLine, Search, Send } from "lucide-react";

const TEAL = "#14b8a6";
const STORE_KEY = "tsu-portal";

type Milestones = {
  submitted: string | null;
  signed: string | null;
  depositPaid: string | null;
  delivered: string | null;
};

type Portal = {
  ref: string;
  company: string;
  contact: string;
  tier: string;
  stage: string;
  stages: string[];
  title: string;
  description: string;
  next: string;
  step: number;
  signedBy: string | null;
  depositPaid: boolean;
  milestones: Milestones;
  payments: { kind: string; amountCents: number | null; currency: string; at: string }[];
  requests: { at: string; body: string }[];
  action: { kind: "sign" | "pay"; label: string; url: string } | null;
};

const REQUEST_KINDS = [
  { value: "question", label: "A question" },
  { value: "update", label: "A progress update" },
  { value: "scope", label: "A change to the scope" },
  { value: "call", label: "A call with the team" },
  { value: "other", label: "Something else" },
];

const PAYMENT_LABEL: Record<string, string> = {
  deposit: "10% deposit",
  mvp: "80% on MVP approval",
  balance: "10% final balance",
  monthly: "Monthly support plan",
};

const money = (cents: number | null, currency: string) =>
  cents == null ? "—" : `${currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase() + " "}${(cents / 100).toLocaleString("en-US")}`;

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;

export default function CustomerPortal() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Portal | null>(null);

  // Request form
  const [kind, setKind] = useState("question");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState("");

  const load = useCallback(async (r: string, e: string, remember = true) => {
    if (!r.trim() || !e.trim()) return;
    setLoading(true);
    setError("");
    setSent(false);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: r, email: e }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setData(d);
        // Same browser only, so a refresh doesn't make them type it all again.
        if (remember) {
          try {
            sessionStorage.setItem(STORE_KEY, JSON.stringify({ ref: r, email: e }));
          } catch {
            // private mode or storage disabled — not a problem
          }
        }
      } else {
        setData(null);
        setError(d.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Prefill from the link in our emails, or resume the last lookup.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const qRef = p.get("ref") || "";
    const qEmail = p.get("e") || "";
    if (qRef) setRef(qRef);
    if (qEmail) setEmail(qEmail);
    if (qRef && qEmail) {
      load(qRef, qEmail);
      return;
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null");
      if (saved?.ref && saved?.email) {
        setRef(saved.ref);
        setEmail(saved.email);
        load(saved.ref, saved.email, false);
      }
    } catch {
      // nothing saved
    }
  }, [load]);

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setSendErr("");
    // The type is prepended to the message so it reaches the team's board and inbox
    // without the API needing to know about request types.
    const label = REQUEST_KINDS.find(k => k.value === kind)?.label || "";
    const body = label ? `[${label}] ${message.trim()}` : message.trim();
    try {
      const res = await fetch("/api/request-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, email, message: body }),
      });
      if (res.ok) {
        setSent(true);
        setMessage("");
        load(ref, email, false); // pull the new request into the list
      } else {
        const d = await res.json().catch(() => ({}));
        setSendErr(d.error || "Could not send your request. Please try again.");
      }
    } catch {
      setSendErr("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  function signOut() {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      // ignore
    }
    setData(null);
    setMessage("");
    setSent(false);
  }

  const card: React.CSSProperties = {
    background: "var(--c-card)", borderRadius: 16, padding: "1.75rem",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  };
  const input: React.CSSProperties = {
    width: "100%", padding: "0.7rem 0.85rem", borderRadius: 10,
    border: "1.5px solid var(--c-border, #e2e8f0)", fontSize: 14,
    background: "var(--c-page)", color: "var(--c-dark)", boxSizing: "border-box",
    fontFamily: "inherit",
  };
  const label: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-mid)",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "var(--c-mid)",
    textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 0.75rem",
  };

  // ── Lookup ────────────────────────────────────────────────────────────────
  if (!data) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--c-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ ...card, maxWidth: 480, width: "100%" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark)", margin: "0 0 0.35rem" }}>
            Your project portal
          </h1>
          <p style={{ color: "var(--c-mid)", fontSize: 14, lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            Enter the reference number from your Build Plan and the email you signed up
            with to track progress, see payments, and send us a request.
          </p>

          <form onSubmit={e => { e.preventDefault(); load(ref, email); }}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={label}>Reference number</label>
              <input style={input} placeholder="SL-12345678" value={ref} onChange={e => setRef(e.target.value)} />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={label}>Email</label>
              <input style={input} type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={loading || !ref.trim() || !email.trim()}
              style={{
                width: "100%", padding: "0.8rem", borderRadius: 10, border: "none",
                background: TEAL, color: "#fff", fontWeight: 700, fontSize: 15,
                cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
              {loading ? "Looking up…" : "Open my portal"}
            </button>
          </form>

          {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: "1rem", textAlign: "center" }}>{error}</p>}

          <p style={{ fontSize: 12, color: "var(--c-light)", marginTop: "1.5rem", textAlign: "center" }}>
            Can’t find your reference? Email{" "}
            <a href="mailto:support@tsu.agency" style={{ color: TEAL }}>support@tsu.agency</a>.
          </p>
        </div>
        <style jsx>{`.spin { animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  // ── Portal ────────────────────────────────────────────────────────────────
  const steps: { key: keyof Milestones; label: string }[] = [
    { key: "submitted", label: "Build Plan received" },
    { key: "signed", label: "Agreement signed" },
    { key: "depositPaid", label: "Deposit paid" },
    { key: "delivered", label: "Delivered" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-page)", padding: "2rem 1rem 3rem" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: "1.25rem" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark)", margin: "0 0 0.2rem" }}>
              {data.company || "Your project"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--c-mid)", margin: 0 }}>
              {data.ref}{data.tier ? ` · ${data.tier}` : ""}
            </p>
          </div>
          <button onClick={signOut} style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", color: "var(--c-mid)", fontSize: 12,
            fontWeight: 600, cursor: "pointer", padding: 4,
          }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Current stage + what's next */}
        <div style={{ ...card, border: `1.5px solid ${TEAL}40`, background: "var(--c-teal-soft, #f0fdfa)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <CheckCircle size={22} color={TEAL} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark)" }}>{data.title}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--c-mid)", margin: "0 0 1rem" }}>{data.description}</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--c-teal-text, #0f766e)", margin: "0 0 4px" }}>WHAT’S NEXT</p>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c-mid)", margin: 0 }}>{data.next}</p>

          {data.action && (
            <a href={data.action.url} style={{
              marginTop: "1.25rem", display: "inline-flex", alignItems: "center", gap: 8,
              background: TEAL, color: "#fff", textDecoration: "none", fontWeight: 700,
              fontSize: 14, padding: "0.7rem 1.3rem", borderRadius: 10,
            }}>
              {data.action.kind === "sign" ? <PenLine size={16} /> : null}
              {data.action.label}
            </a>
          )}
        </div>

        {/* Milestones */}
        <div style={{ ...card, marginTop: "1rem" }}>
          <p style={sectionTitle}>Progress</p>
          {steps.map(s => {
            const at = day(data.milestones[s.key]);
            const done = !!data.milestones[s.key];
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.5rem 0" }}>
                {done ? <CheckCircle size={18} color={TEAL} /> : <Circle size={18} color="var(--c-border, #e2e8f0)" />}
                <span style={{ fontSize: 14, color: done ? "var(--c-dark)" : "var(--c-light)", fontWeight: done ? 600 : 400 }}>
                  {s.label}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--c-light)" }}>{at || ""}</span>
              </div>
            );
          })}
          {data.signedBy && (
            <p style={{ fontSize: 12, color: "var(--c-light)", margin: "0.75rem 0 0" }}>
              Signed by {data.signedBy}.
            </p>
          )}
        </div>

        {/* Payments */}
        <div style={{ ...card, marginTop: "1rem" }}>
          <p style={sectionTitle}>Payments</p>
          {data.payments.length ? (
            data.payments.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.45rem 0", borderTop: i ? "1px solid var(--c-border, #e2e8f0)" : "none" }}>
                <span style={{ fontSize: 14, color: "var(--c-dark)" }}>{PAYMENT_LABEL[p.kind] || p.kind}</span>
                <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: "var(--c-dark)" }}>
                  {money(p.amountCents, p.currency)}
                </span>
                <span style={{ fontSize: 12, color: "var(--c-light)", minWidth: 90, textAlign: "right" }}>{day(p.at)}</span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: "var(--c-mid)", margin: 0 }}>
              No payments recorded yet. Receipts come from Stripe by email.
            </p>
          )}
        </div>

        {/* Requests */}
        <div style={{ ...card, marginTop: "1rem" }}>
          <p style={sectionTitle}>Send us a request</p>

          {sent && (
            <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, margin: "0 0 0.75rem" }}>
              ✓ Sent — our team will come back to you by email.
            </p>
          )}

          <form onSubmit={sendRequest}>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={label}>What do you need?</label>
              <select style={input} value={kind} onChange={e => setKind(e.target.value)}>
                {REQUEST_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <textarea
              style={{ ...input, minHeight: 90, resize: "vertical" }}
              placeholder="Tell us what you need and we’ll reply by email."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            {sendErr && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>{sendErr}</p>}
            <button type="submit" disabled={sending || !message.trim()}
              style={{
                marginTop: 10, padding: "0.6rem 1.1rem", borderRadius: 9, border: "none",
                background: "var(--c-dark)", color: "var(--c-card)", fontWeight: 700, fontSize: 13,
                cursor: sending || !message.trim() ? "default" : "pointer",
                opacity: sending || !message.trim() ? 0.6 : 1,
                display: "inline-flex", alignItems: "center", gap: 7,
              }}>
              {sending ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              {sending ? "Sending…" : "Send request"}
            </button>
          </form>

          {data.requests.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <p style={sectionTitle}>Your previous requests</p>
              {data.requests.map((r, i) => (
                <div key={i} style={{ padding: "0.6rem 0", borderTop: i ? "1px solid var(--c-border, #e2e8f0)" : "none" }}>
                  <p style={{ fontSize: 12, color: "var(--c-light)", margin: "0 0 2px" }}>{day(r.at)}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c-mid)", margin: 0, whiteSpace: "pre-wrap" }}>{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: "var(--c-light)", textAlign: "center", marginTop: "1.5rem" }}>
          Need a hand? Email <a href="mailto:support@tsu.agency" style={{ color: TEAL }}>support@tsu.agency</a> and we’ll pick it up.
        </p>
      </div>
      <style jsx>{`.spin { animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
