"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Circle, Loader2, LogOut, Mail, PenLine, Send } from "lucide-react";

const TEAL = "#14b8a6";

type Milestones = {
  submitted: string | null;
  signed: string | null;
  depositPaid: string | null;
  delivered: string | null;
};

type Portal = {
  signedInAs: string;
  projects: { ref: string; company: string; stage: string }[];
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
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // First paint, before we know whether the cookie is good. Separate from
  // loading so the sign-in button does not render as if it were mid-send.
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Portal | null>(null);
  const [linkSent, setLinkSent] = useState("");

  // Request form
  const [kind, setKind] = useState("question");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState("");

  // The session cookie is the whole of the sign-in state, so loading the
  // portal is just asking whether it is still good. A 401 is the normal
  // not-signed-in case, not an error worth showing.
  const load = useCallback(async (wantRef?: string) => {
    setLoading(true);
    setSent(false);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wantRef ? { ref: wantRef } : {}),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setData(d);
        setError("");
      } else {
        setData(null);
        if (res.status !== 401) setError(d.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Older emails link to /status?ref=...&e=... Those are no longer
    // credentials, but the address is still a sensible thing to prefill.
    const p = new URLSearchParams(window.location.search);
    const qEmail = p.get("e");
    if (qEmail) setEmail(qEmail);
    load();
  }, [load]);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setLinkSent(d.message || "Check your email.");
      else setError(d.error || "Could not send that. Try again shortly.");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

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
        body: JSON.stringify({ ref: data?.ref, message: body }),
      });
      if (res.ok) {
        setSent(true);
        setMessage("");
        load(data?.ref); // pull the new request into the list
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

  async function signOut() {
    try {
      await fetch("/api/portal/session", { method: "DELETE" });
    } catch {
      // the cookie expires on its own soon enough
    }
    setData(null);
    setMessage("");
    setSent(false);
    setLinkSent("");
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

  // ── Checking the session ──────────────────────────────────────────────────
  if (checking) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--c-page)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={22} className="spin" color="var(--c-light)" />
        <style jsx>{`.spin { animation: spin 0.8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  // ── Sign in ───────────────────────────────────────────────────────────────
  if (!data) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--c-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ ...card, maxWidth: 480, width: "100%" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark)", margin: "0 0 0.35rem" }}>
            Your project portal
          </h1>

          {linkSent ? (
            <>
              <p style={{ color: "var(--c-mid)", fontSize: 14, lineHeight: 1.7, margin: "0.75rem 0 1.25rem" }}>
                {linkSent}
              </p>
              <p style={{ fontSize: 13, color: "var(--c-light)", lineHeight: 1.7, margin: 0 }}>
                Open it on this device if you can. Nothing happens until you press the button on the page it
                opens, so it is safe if your email provider checks links first.
              </p>
              <button
                onClick={() => { setLinkSent(""); }}
                style={{
                  marginTop: "1.25rem", background: "none", border: "none", padding: 0,
                  color: TEAL, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                Use a different address
              </button>
            </>
          ) : (
            <>
              <p style={{ color: "var(--c-mid)", fontSize: 14, lineHeight: 1.6, margin: "0 0 1.5rem" }}>
                Give us the email address you signed up with and we will send you a link that opens your portal.
                No password, and no reference number to dig out.
              </p>

              <form onSubmit={requestLink}>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={label}>Email</label>
                  <input style={input} type="email" required placeholder="you@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" disabled={loading || !email.trim()}
                  style={{
                    width: "100%", padding: "0.8rem", borderRadius: 10, border: "none",
                    background: TEAL, color: "#fff", fontWeight: 700, fontSize: 15,
                    cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  {loading ? <Loader2 size={18} className="spin" /> : <Mail size={18} />}
                  {loading ? "Sending…" : "Email me a link"}
                </button>
              </form>

              {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: "1rem", textAlign: "center" }}>{error}</p>}

              <p style={{ fontSize: 12, color: "var(--c-light)", marginTop: "1.5rem", textAlign: "center" }}>
                Using a different address to the one on your Build Plan? Email{" "}
                <a href="mailto:support@tsu.agency" style={{ color: TEAL }}>support@tsu.agency</a>.
              </p>
            </>
          )}
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
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <button onClick={signOut} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none", color: "var(--c-mid)", fontSize: 12,
              fontWeight: 600, cursor: "pointer", padding: 4,
            }}>
              <LogOut size={14} /> Sign out
            </button>
            <p style={{ fontSize: 11, color: "var(--c-light)", margin: "2px 4px 0" }}>{data.signedInAs}</p>
          </div>
        </div>

        {/* One address can own more than one build. */}
        {data.projects?.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.25rem" }}>
            {data.projects.map(p => {
              const active = p.ref === data.ref;
              return (
                <button key={p.ref} onClick={() => !active && load(p.ref)} style={{
                  padding: "0.4rem 0.7rem", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: active ? "default" : "pointer", fontFamily: "inherit",
                  border: `1.5px solid ${active ? TEAL : "var(--c-border, #e2e8f0)"}`,
                  background: active ? `${TEAL}18` : "var(--c-card)",
                  color: active ? TEAL : "var(--c-mid)",
                }}>
                  {p.company || p.ref}
                </button>
              );
            })}
          </div>
        )}

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
              Sent. Our team will come back to you by email.
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
