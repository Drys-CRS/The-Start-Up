"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, MailX } from "lucide-react";

const TEAL = "#14b8a6";

type State = "ready" | "working" | "done" | "error";

export default function UnsubscribePage() {
  const [params, setParams] = useState({ b: "", item: "", e: "" });
  const [state, setState] = useState<State>("ready");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setParams({ b: p.get("b") || "", item: p.get("item") || "", e: p.get("e") || "" });
  }, []);

  const complete = !!(params.b && params.item && params.e);

  async function unsubscribe() {
    setState("working");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        setState("done");
      } else {
        const d = await res.json().catch(() => ({}));
        setErrMsg(d.error || "Something went wrong — please try again.");
        setState("error");
      }
    } catch {
      setErrMsg("Network error — please check your connection and try again.");
      setState("error");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ background: "var(--c-card)", borderRadius: 16, padding: "2.5rem 2rem", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {state === "done" ? (
          <>
            <CheckCircle size={48} color={TEAL} style={{ margin: "0 auto 1rem" }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-dark)", margin: "0 0 0.5rem" }}>You&apos;re unsubscribed</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--c-mid)", margin: 0 }}>
              We won&apos;t send you any more reminders. Emails about an agreement you&apos;ve signed or a payment you&apos;ve made will still reach you.
            </p>
          </>
        ) : (
          <>
            <MailX size={48} color={TEAL} style={{ margin: "0 auto 1rem" }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-dark)", margin: "0 0 0.5rem" }}>Stop reminder emails?</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--c-mid)", margin: "0 0 1.5rem" }}>
              {complete
                ? <>We&apos;ll stop sending follow-up reminders to <strong style={{ color: "var(--c-dark)" }}>{params.e}</strong>.</>
                : "This unsubscribe link is incomplete. Please use the link from your email."}
            </p>
            <button
              onClick={unsubscribe}
              disabled={!complete || state === "working"}
              style={{
                width: "100%", padding: "0.8rem", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                background: complete ? TEAL : "var(--c-border)", color: complete ? "#fff" : "var(--c-light)",
                cursor: complete && state !== "working" ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {state === "working" ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Unsubscribing…</> : "Unsubscribe"}
            </button>
            {state === "error" && (
              <p style={{ fontSize: 13, color: "#dc2626", margin: "1rem 0 0" }}>{errMsg}</p>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
