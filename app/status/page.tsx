"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Search, Send } from "lucide-react";
import { STAGE_ORDER } from "@/lib/status";

const TEAL = "#14b8a6";

type StatusResult = {
  ref: string;
  stageLabel: string;
  title: string;
  description: string;
  next: string;
  step: number;
};

export default function StatusPage() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<StatusResult | null>(null);

  // Nudge / request-update state
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [nudgeErr, setNudgeErr] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setRef(p.get("ref") || "");
    setEmail(p.get("e") || "");
  }, []);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!ref.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSent(false);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, email }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setResult(d);
      else setError(d.error || "Something went wrong. Please try again.");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setNudgeErr("");
    try {
      const res = await fetch("/api/request-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, email, message }),
      });
      if (res.ok) {
        setSent(true);
        setMessage("");
      } else {
        const d = await res.json().catch(() => ({}));
        setNudgeErr(d.error || "Could not send your request. Please try again.");
      }
    } catch {
      setNudgeErr("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  const card: React.CSSProperties = {
    background: "var(--c-card)", borderRadius: 16, padding: "2rem",
    maxWidth: 520, width: "100%",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  };
  const input: React.CSSProperties = {
    width: "100%", padding: "0.7rem 0.85rem", borderRadius: 10,
    border: "1.5px solid var(--c-border, #e2e8f0)", fontSize: 14,
    background: "var(--c-page)", color: "var(--c-dark)", boxSizing: "border-box",
  };
  const label: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-mid)",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4,
  };

  return (
    <main style={{
      minHeight: "100vh", background: "var(--c-page)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
    }}>
      <div style={card}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark)", margin: "0 0 0.35rem" }}>
          Track your build
        </h1>
        <p style={{ color: "var(--c-mid)", fontSize: 14, lineHeight: 1.6, margin: "0 0 1.5rem" }}>
          Enter the reference number from your Build Plan and the email you signed
          up with to see exactly where your project stands.
        </p>

        <form onSubmit={lookup}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={label}>Reference number</label>
            <input style={input} placeholder="SL-12345678" value={ref}
              onChange={(e) => setRef(e.target.value)} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={label}>Email</label>
            <input style={input} type="email" placeholder="you@company.com" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" disabled={loading || !ref.trim() || !email.trim()}
            style={{
              width: "100%", padding: "0.8rem", borderRadius: 10, border: "none",
              background: TEAL, color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
            {loading ? "Looking up…" : "Check status"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#dc2626", fontSize: 13, marginTop: "1rem", textAlign: "center" }}>
            {error}
          </p>
        )}

        {result && (
          <div style={{ marginTop: "1.75rem" }}>
            {/* Progress steps */}
            <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
              {STAGE_ORDER.map((s, i) => (
                <div key={s} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: result.step > 0 && i < result.step ? TEAL : "var(--c-border, #e2e8f0)",
                }} />
              ))}
            </div>

            <div style={{
              background: "var(--c-teal-soft, #f0fdfa)", border: `1.5px solid ${TEAL}40`,
              borderRadius: 12, padding: "1.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <CheckCircle size={22} color={TEAL} />
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark)" }}>
                  {result.title}
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--c-mid)", margin: "0 0 1rem" }}>
                {result.description}
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--c-teal-text, #0f766e)", margin: "0 0 4px" }}>
                WHAT'S NEXT
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c-mid)", margin: 0 }}>
                {result.next}
              </p>
            </div>

            {/* Request an update */}
            <div style={{ marginTop: "1.5rem" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-dark)", margin: "0 0 0.5rem" }}>
                Need something? Request an update
              </p>
              {sent ? (
                <p style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>
                  ✓ Sent — our team will get back to you shortly.
                </p>
              ) : (
                <form onSubmit={sendUpdate}>
                  <textarea
                    style={{ ...input, minHeight: 90, resize: "vertical", fontFamily: "inherit" }}
                    placeholder="Ask a question or request an update on your build…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {nudgeErr && (
                    <p style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>{nudgeErr}</p>
                  )}
                  <button type="submit" disabled={sending || !message.trim()}
                    style={{
                      marginTop: 10, padding: "0.6rem 1.1rem", borderRadius: 9, border: "none",
                      background: "var(--c-dark)", color: "#fff", fontWeight: 700, fontSize: 13,
                      cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1,
                      display: "inline-flex", alignItems: "center", gap: 7,
                    }}>
                    {sending ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                    {sending ? "Sending…" : "Send request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
