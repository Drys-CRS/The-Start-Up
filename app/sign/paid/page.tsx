"use client";
import { useEffect, useState } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";

const TEAL = "#14b8a6";

export default function PaidPage() {
  const [ref, setRef] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setRef(p.get("ref") || "");
  }, []);
  const statusHref = `/status${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;

  return (
    <main style={{
      minHeight: "100vh", background: "var(--c-page)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
    }}>
      <div style={{
        background: "var(--c-card)", borderRadius: 16, padding: "3rem 2.5rem",
        maxWidth: 480, width: "100%", textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <CheckCircle size={56} color={TEAL} style={{ margin: "0 auto 1.25rem" }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark)", margin: "0 0 0.5rem" }}>
          Payment Received
        </h1>
        <p style={{ color: "var(--c-mid)", fontSize: 15, lineHeight: 1.6, margin: "0 0 1.75rem" }}>
          Your agreement is signed and your payment is confirmed.
          The Startup team will be in touch within one business day to kick off your build.
        </p>

        <div style={{
          background: "var(--c-teal-soft)", border: `1.5px solid ${TEAL}40`,
          borderRadius: 12, padding: "1.25rem", textAlign: "left",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-teal-text)", margin: "0 0 0.75rem" }}>
            WHAT HAPPENS NEXT
          </p>
          {[
            "You'll get a payment receipt from Stripe, plus a confirmation email from us.",
            "We'll reach out within one business day to schedule your kick-off call.",
            "Your 30-day build clock starts on the agreed start date.",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: TEAL, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: 13, color: "var(--c-mid)" }}>{step}</span>
            </div>
          ))}
        </div>

        <a href={statusHref} style={{
          marginTop: "1.5rem", display: "inline-flex", alignItems: "center", gap: 8,
          background: TEAL, color: "#fff", textDecoration: "none", fontWeight: 700,
          fontSize: 14, padding: "0.75rem 1.5rem", borderRadius: 10,
        }}>
          Track your build status <ArrowRight size={16} />
        </a>
      </div>
    </main>
  );
}
