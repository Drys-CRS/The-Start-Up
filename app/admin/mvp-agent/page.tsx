"use client";
import { useState } from "react";
import { Loader2, Sparkles, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

const TEAL = "#14b8a6";

export default function MvpAgentPage() {
  const [itemId, setItemId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult]   = useState<null | { boardId?: string; tasksCreated: number; log: string[]; error?: string }>(null);

  async function run() {
    if (!itemId.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/agent/mvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeLockItemId: itemId.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ tasksCreated: 0, log: [], error: String(e) });
    } finally {
      setRunning(false);
    }
  }

  const ok = result && !result.error;

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "var(--c-card)", borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 640, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <Sparkles size={22} color={TEAL} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--c-dark)", margin: 0 }}>MVP Planning Agent</h1>
            <p style={{ fontSize: 12, color: "var(--c-mid)", margin: 0 }}>Reads a Scope Lock → builds full task plan in Monday.com</p>
          </div>
        </div>

        {/* Input */}
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--c-mid)", letterSpacing: 0.5, marginBottom: 6 }}>
          SCOPE LOCK ITEM ID
        </label>
        <input
          value={itemId}
          onChange={e => setItemId(e.target.value)}
          placeholder="e.g. 18419179036"
          style={{ width: "100%", padding: "0.7rem 0.9rem", border: "1.5px solid var(--c-border)", borderRadius: 8, fontSize: 14, color: "var(--c-dark)", background: "var(--c-input-bg)", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }}
        />

        <button
          onClick={run}
          disabled={running || !itemId.trim()}
          style={{ width: "100%", padding: "0.85rem", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, background: running || !itemId.trim() ? "var(--c-border)" : TEAL, color: running || !itemId.trim() ? "var(--c-light)" : "#fff", cursor: running || !itemId.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          {running
            ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Agent running — this takes 1–2 minutes…</>
            : <><Sparkles size={17} /> Run MVP Agent</>}
        </button>

        {/* Result */}
        {result && (
          <div style={{ marginTop: "1.5rem" }}>
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
                    href={`https://drystangovender-team.monday.com/boards/${result.boardId}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: TEAL, fontWeight: 600, textDecoration: "none" }}
                  >
                    Open board in Monday.com <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ) : (
              <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle size={18} color="#dc2626" />
                  <span style={{ fontSize: 13, color: "#b91c1c" }}>{result.error}</span>
                </div>
              </div>
            )}

            {/* Agent log */}
            {result.log && result.log.length > 0 && (
              <details style={{ marginTop: "1rem" }}>
                <summary style={{ fontSize: 12, color: "var(--c-mid)", cursor: "pointer", fontWeight: 600 }}>
                  Agent log ({result.log.length} steps)
                </summary>
                <pre style={{ marginTop: 8, fontSize: 11, color: "var(--c-mid)", background: "var(--c-subtle)", borderRadius: 8, padding: "0.75rem", overflow: "auto", maxHeight: 320, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
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
