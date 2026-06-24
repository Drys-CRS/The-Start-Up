"use client";
import { CheckCircle } from "lucide-react";

export default function PaidPage() {
  return (
    <main style={{
      minHeight: "100vh", background: "#f1f5f9",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "3rem 2.5rem",
        maxWidth: 480, width: "100%", textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <CheckCircle size={56} color="#14b8a6" style={{ margin: "0 auto 1.25rem" }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
          Payment Received
        </h1>
        <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.6, margin: "0 0 1.75rem" }}>
          Your agreement is signed and your payment is confirmed.
          The Startup team will be in touch within one business day to kick off your build.
        </p>

        <div style={{
          background: "#f0fdfa", border: "1.5px solid #99f6e4",
          borderRadius: 12, padding: "1.25rem", textAlign: "left",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0f766e", margin: "0 0 0.75rem" }}>
            WHAT HAPPENS NEXT
          </p>
          {[
            "You'll receive an invoice and payment confirmation by email.",
            "We'll schedule your kick-off call within 24 hours.",
            "Your 30-day build clock starts on the agreed start date.",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#14b8a6", flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: 13, color: "#475569" }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
