"use client";
import { useState } from "react";
import { Loader2, Sparkles, CheckCircle, AlertCircle, ExternalLink, CreditCard, Zap } from "lucide-react";

const TEAL = "#14b8a6";

type RunResult = { boardId?: string; tasksCreated: number; log: string[]; error?: string } | null;

export default function MvpAgentPage() {
  const [itemId,  setItemId]  = useState("");
  const [running, setRunning] = useState<"agent" | "bypass" | null>(null);
  const [paid,    setPaid]    = useState(false);
  const [result,  setResult]  = useState<RunResult>(null);

  async function markPaid() {
    if (!itemId.trim()) return;
    setRunning("bypass");
    setResult(null);
    setPaid(false);
    try {
      const res = await fetch("/api/dev/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: itemId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPaid(true);
    } catch (e) {
      setResult({ tasksCreated: 0, log: [], error: String(e) });
    } finally {
      setRunning(null);
    }
  }

  async function runAgent() {
    if (!itemId.trim()) return;
    setRunning("agent");
    setResult(null);
    try {
      const res = await fetch("/api/agent/mvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeLockItemId: itemId.trim() }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ tasksCreated: 0, log: [], error: String(e) });
    } finally {
      setRunning(null);
    }
  }

  async function bypassAndRun() {
    if (!itemId.trim()) return;
    setRunning("bypass");
    setResult(null);
    setPaid(false);
    try {
      const pr = await fetch("/api/dev/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: itemId.trim() }),
      });
      if (!pr.ok) throw new Error((await pr.json()).error || "Mark-paid failed");
      setPaid(true);
      setRunning("agent");
      const ar = await fetch("/api/agent/mvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeLockItemId: itemId.trim() }),
      });
      setResult(await ar.json());
    } catch (e) {
      setResult({ tasksCreated: 0, log: [], error: String(e) });
    } finally {
      setRunning(null);
    }
  }

  const busy = running !== null;
  const ok   = result && !result.error;

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "var(--c-card)", borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 660, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.75rem" }}>
          <Sparkles size={22} color={TEAL} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--c-dark)", margin: 0 }}>MVP Planning Agent</h1>
            <p style={{ fontSize: 12, color: "var(--c-mid)", margin: 0 }}>Reads a Scope Lock → builds full task plan in Monday.com</p>
          </div>
        </div>

        {/* Item ID input */}
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--c-mid)", letterSpacing: 0.5, marginBottom: 6 }}>
          SCOPE LOCK ITEM ID
        </label>
        <input
          value={itemId}
          onChange={e => { setItemId(e.target.value); setPaid(false); setResult(null); }}
          placeholder="Paste the Monday.com item ID from the Scope Locks board"
          style={{ width: "100%", padding: "0.7rem 0.9rem", border: "1.5px solid var(--c-border)", borderRadius: 8, fontSize: 14, color: "var(--c-dark)", background: "var(--c-input-bg)", outline: "none", boxSizing: "border-box", marginBottom: "1.25rem" }}
        />

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Primary: bypass + run in one click */}
          <button
            onClick={bypassAndRun}
            disabled={busy || !itemId.trim()}
            style={{ width: "100%", padding: "0.85rem", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
              background: busy || !itemId.trim() ? "var(--c-border)" : TEAL,
              color: busy || !itemId.trim() ? "var(--c-light)" : "#fff",
              cursor: busy || !itemId.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {running === "bypass" && <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Marking as paid…</>}
            {running === "agent"  && <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Agent running — 1–2 min…</>}
            {!running && <><Zap size={17} /> Skip Checkout &amp; Run Agent</>}
          </button>

          {/* Secondary row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={markPaid}
              disabled={busy || !itemId.trim()}
              style={{ padding: "0.7rem", border: `1.5px solid var(--c-border)`, borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: "var(--c-subtle)", color: "var(--c-mid)", cursor: busy || !itemId.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              {running === "bypass" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CreditCard size={14} />}
              Mark as Paid only
            </button>
            <button
              onClick={runAgent}
              disabled={busy || !itemId.trim()}
              style={{ padding: "0.7rem", border: `1.5px solid var(--c-border)`, borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: "var(--c-subtle)", color: "var(--c-mid)", cursor: busy || !itemId.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              {running === "agent" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />}
              Run Agent only
            </button>
          </div>
        </div>

        {/* Paid confirmation */}
        {paid && !result && (
          <div style={{ marginTop: "1rem", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={16} color="#16a34a" />
            <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>Marked as Deposit Paid in Monday.com</span>
          </div>
        )}

        {/* Agent result */}
        {result && (
          <div style={{ marginTop: "1.25rem" }}>
            {ok ? (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={18} color="#16a34a" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>
                    Done — {result.tasksCreated} tasks created
                  </span>
                </div>
                {result.boardId && (
                  <a
                    href={`https://view.monday.com/boards/${result.boardId}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: TEAL, fontWeight: 600, textDecoration: "none" }}
                  >
                    Open board in Monday.com <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ) : (
              <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={18} color="#dc2626" />
                <span style={{ fontSize: 13, color: "#b91c1c" }}>{result.error}</span>
              </div>
            )}

            {result.log && result.log.length > 0 && (
              <details style={{ marginTop: "1rem" }}>
                <summary style={{ fontSize: 12, color: "var(--c-mid)", cursor: "pointer", fontWeight: 600 }}>
                  Agent log ({result.log.length} steps)
                </summary>
                <pre style={{ marginTop: 8, fontSize: 11, color: "var(--c-mid)", background: "var(--c-subtle)", borderRadius: 8, padding: "0.75rem", overflow: "auto", maxHeight: 360, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {result.log.join("\n")}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
