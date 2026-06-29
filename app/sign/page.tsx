"use client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, Loader2, CreditCard, ShieldCheck, RefreshCw } from "lucide-react";

type Stage = "form" | "signing" | "signed" | "paying" | "error";

// TEAL is brand-constant; all other colours come from CSS custom properties
// so they switch automatically with the dark/light class on <html>.
const TEAL = "#14b8a6";

const TIER_LABEL: Record<string, string> = {
  promo:   "Promotional — Limited Time",
  premium: "Premium",
};

// Payment structure: 10% deposit now → 80% on MVP plan approval → 10% on delivery
const AMOUNTS: Record<string, Record<string, { total: string; deposit: string; mvp: string; balance: string }>> = {
  promo: {
    USD: { total: "$3,000",   deposit: "$300",    mvp: "$2,400",   balance: "$300"    },
    ZAR: { total: "R60,000",  deposit: "R6,000",  mvp: "R48,000",  balance: "R6,000"  },
  },
  premium: {
    USD: { total: "$5,000",   deposit: "$500",    mvp: "$4,000",   balance: "$500"    },
    ZAR: { total: "R100,000", deposit: "R10,000", mvp: "R80,000",  balance: "R10,000" },
  },
};

const KEY_TERMS = [
  "The investment amount and payment schedule as outlined in your proposal",
  "The 30-day build commitment and 60–90 day support period",
  "All Terms & Conditions including scope, confidentiality, and liability",
  "Ownership of all deliverables transfers to you upon final payment",
];

export default function SignPage() {
  const [ref,         setRef]         = useState("");
  const [item,        setItem]        = useState("");
  const [tier,        setTier]        = useState("premium");
  const [cur,         setCur]         = useState("USD");
  const [email,       setEmail]       = useState("");
  const [monthlyTools, setMonthlyTools] = useState<number | null>(null);
  const [monthlyOptIn, setMonthlyOptIn] = useState(false);

  const [name,   setName]   = useState("");
  const [agreed, setAgreed] = useState(false);

  const [stage,  setStage]  = useState<Stage>("form");
  const [errMsg, setErrMsg] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setRef(p.get("ref")   || "");
    setItem(p.get("item") || "");
    setTier(p.get("t")    || "premium");
    setCur(p.get("c")     || "USD");
    setEmail(p.get("e")   || "");
    const mt = p.get("mtools");
    if (mt && !isNaN(Number(mt))) setMonthlyTools(Number(mt));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!name.trim()) return;
    ctx.font = "italic 30px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.trim(), canvas.width / 2, canvas.height / 2);
  }, [name]);

  async function submitSignature() {
    if (!name.trim() || !agreed) return;
    setStage("signing");
    try {
      const sigDataUrl = canvasRef.current!.toDataURL("image/png");
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, item, name, sigDataUrl, tier, cur }),
      });
      if (res.ok) { setStage("signed"); }
      else {
        const d = await res.json().catch(() => ({}));
        setErrMsg(d.error || "Submission failed — please try again.");
        setStage("error");
      }
    } catch {
      setErrMsg("Network error — please check your connection and try again.");
      setStage("error");
    }
  }

  async function startPayment() {
    setStage("paying");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, item, tier, cur, email, paymentType: "deposit" }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      setErrMsg("Could not start payment — please contact us directly.");
      setStage("error");
    }
  }

  async function startMonthlyPlan() {
    setStage("paying");
    const res = await fetch("/api/checkout/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolsMonthlyUsd: monthlyTools, email, ref, item }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      setErrMsg("Could not start subscription — please contact us directly.");
      setStage("error");
    }
  }

  const amountInfo = AMOUNTS[tier]?.[cur] ?? AMOUNTS.premium.USD;
  const ai = amountInfo; // shorthand
  const canSign    = name.trim().length > 0 && agreed;

  // ── Signed success + payment ───────────────────────────────────────────────
  if (stage === "signed" || stage === "paying") {
    return (
      <main style={S.page}>
        <div style={{ ...S.card, maxWidth: 540 }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <CheckCircle size={52} color={TEAL} style={{ margin: "0 auto 0.75rem" }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-dark)", margin: "0 0 0.4rem" }}>
              Agreement Signed
            </h1>
            <p style={{ color: "var(--c-mid)", fontSize: 14, margin: 0 }}>
              Your signature has been recorded and attached to your scope lock record.
            </p>
          </div>

          <div style={{ background: "var(--c-subtle)", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <Row label="Reference" value={ref || "—"} />
            <Row label="Signed by" value={name} />
            <Row label="Date"      value={new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })} />
            <Row label="Package"   value={TIER_LABEL[tier] ?? tier} last />
          </div>

          <div style={{ borderTop: `1.5px solid var(--c-border)`, paddingTop: "1.5rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--c-dark)", margin: "0 0 0.5rem" }}>
              Pay Your 10% Deposit to Start
            </h2>
            <p style={{ color: "var(--c-mid)", fontSize: 13, margin: "0 0 1rem", lineHeight: 1.5 }}>
              This secures your start date and kicks off planning. The remaining payments are tied to build milestones.
            </p>

            {/* Payment milestone breakdown */}
            <div style={{ background: "var(--c-subtle)", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1rem" }}>
              {[
                { phase: "10% now",         amount: ai.deposit, note: "Deposit — secures your start date",        active: true  },
                { phase: "80% on approval", amount: ai.mvp,     note: "After MVP plan is reviewed and approved",   active: false },
                { phase: "10% on delivery", amount: ai.balance,  note: "Final balance at end of 30-day build",    active: false },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.5rem 0", borderBottom: i < 2 ? `1px solid var(--c-border)` : "none" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.active ? TEAL : "var(--c-mid)" }}>{row.phase}</span>
                    <div style={{ fontSize: 11, color: "var(--c-light)", marginTop: 1 }}>{row.note}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: row.active ? TEAL : "var(--c-mid)" }}>{row.amount}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem" }}>
                <span style={{ fontSize: 11, color: "var(--c-light)", fontWeight: 600 }}>TOTAL INVESTMENT</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-dark)" }}>{ai.total}</span>
              </div>
            </div>

            {/* Monthly plan opt-in — always visible; tools line added when mtools param present */}
            {(() => {
              const monthlyTotal = 150 + (monthlyTools ?? 0);
              const toolsLine = monthlyTools !== null
                ? { label: "Tools & Subscriptions", amount: `$${monthlyTools}/mo`, note: "Hosting, APIs, and platform costs based on your scope" }
                : null;
              return (
                <div style={{ border: `1.5px solid ${monthlyOptIn ? TEAL : "var(--c-border)"}`,
                  borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1rem", transition: "border-color 0.2s" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={monthlyOptIn} onChange={e => setMonthlyOptIn(e.target.checked)}
                      style={{ marginTop: 3, accentColor: TEAL, width: 15, height: 15, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-dark)", marginBottom: 2 }}>
                        Add Ongoing Support &amp; Tools Coverage
                      </div>
                      <div style={{ fontSize: 12, color: "var(--c-mid)", lineHeight: 1.5 }}>
                        Keep your system running after your included support period ends. This subscription only starts once your {TIER_LABEL[tier] === "Promotional" ? "90" : "120"}-day support period completes — <strong>nothing is charged today or during your build.</strong>
                      </div>
                    </div>
                  </label>

                  {monthlyOptIn && (
                    <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: `1px solid var(--c-border)` }}>
                      {[
                        ...(toolsLine ? [toolsLine] : []),
                        { label: "Ongoing Support", amount: "$150/mo", note: "Priority support, guidance, and maintenance" },
                      ].map((row, i, arr) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "0.45rem 0", borderBottom: i < arr.length - 1 ? `1px solid var(--c-border)` : "none" }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-mid)" }}>{row.label}</span>
                            <div style={{ fontSize: 11, color: "var(--c-light)", marginTop: 1 }}>{row.note}</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-mid)" }}>{row.amount}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: 11, color: "var(--c-light)", fontWeight: 600, display: "block" }}>SUBSCRIPTION TOTAL</span>
                          <span style={{ fontSize: 10, color: "var(--c-light)" }}>Starts after your {TIER_LABEL[tier] === "Promotional" ? "90" : "120"}-day support ends</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: TEAL }}>${monthlyTotal}/mo</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <button
              onClick={startPayment}
              disabled={stage === "paying"}
              style={{ ...S.btn, background: TEAL, color: "#fff", cursor: "pointer", marginBottom: monthlyOptIn ? "0.6rem" : 0 }}
            >
              {stage === "paying"
                ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Redirecting…</>
                : <><CreditCard size={17} /> Pay {ai.deposit} deposit</>}
            </button>

            {monthlyOptIn && (
              <button
                onClick={startMonthlyPlan}
                disabled={stage === "paying"}
                style={{ ...S.btn, background: "var(--c-subtle)", color: TEAL, border: `1.5px solid ${TEAL}40`, cursor: "pointer" }}
              >
                {stage === "paying"
                  ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Redirecting…</>
                  : <><RefreshCw size={17} /> Activate post-support subscription (${150 + (monthlyTools ?? 0)}/mo)</>}
              </button>
            )}

            <p style={{ color: "var(--c-light)", fontSize: 11, textAlign: "center", marginTop: "0.6rem" }}>
              Secured by Stripe — SSL encrypted
            </p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  // ── Error screen ───────────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <main style={S.page}>
        <div style={{ ...S.card, maxWidth: 440, textAlign: "center" }}>
          <AlertCircle size={48} color="#dc2626" style={{ margin: "0 auto 1rem" }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--c-dark)", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "var(--c-mid)", fontSize: 14, marginBottom: "1.5rem" }}>{errMsg}</p>
          <button onClick={() => setStage("form")} style={{ ...S.btn, background: TEAL, color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <main style={S.page}>
      <div style={{ ...S.card, maxWidth: 580 }}>

        {/* Header */}
        <div style={{ background: "#0f172a", margin: "-2rem -2rem 1.75rem", borderRadius: "16px 16px 0 0", padding: "1.5rem 2rem" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: 2, marginBottom: 6 }}>THE STARTUP</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Scope Lock Agreement</h1>
          {ref && <div style={{ fontSize: 12, color: "#94a3b8" }}>Reference: {ref}</div>}
        </div>

        {/* Package summary */}
        <div style={{ background: "var(--c-teal-soft)", border: `1.5px solid ${TEAL}40`, borderRadius: 10,
          padding: "0.85rem 1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, marginBottom: 2 }}>SELECTED PACKAGE</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--c-dark)" }}>{TIER_LABEL[tier] ?? tier}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: TEAL }}>{ai.total}</div>
              <div style={{ fontSize: 11, color: "var(--c-mid)" }}>total investment</div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${TEAL}30`, paddingTop: 8, display: "flex", gap: 8, justifyContent: "space-between" }}>
            {[
              { label: "10% deposit today", value: ai.deposit },
              { label: "80% on MVP approval", value: ai.mvp },
              { label: "10% on delivery", value: ai.balance },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? TEAL : "var(--c-mid)" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "var(--c-light)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly plan preview — always visible; tools line only shown when mtools param present */}
        <div style={{ background: "var(--c-subtle)", border: `1.5px solid var(--c-border)`,
          borderRadius: 10, padding: "0.85rem 1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <RefreshCw size={14} color={TEAL} />
            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: 0.5 }}>OPTIONAL: ONGOING SUPPORT &amp; TOOLS</span>
          </div>
          {monthlyTools !== null && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: `1px solid var(--c-border)` }}>
              <span style={{ fontSize: 12, color: "var(--c-mid)" }}>Tools &amp; Subscriptions</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-mid)" }}>${monthlyTools}/mo</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0",
            borderBottom: monthlyTools !== null ? `1px solid var(--c-border)` : "none" }}>
            <span style={{ fontSize: 12, color: "var(--c-mid)" }}>Ongoing Support</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-mid)" }}>$150/mo</span>
          </div>
          {monthlyTools !== null && (
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem" }}>
              <span style={{ fontSize: 11, color: "var(--c-light)", fontWeight: 600 }}>MONTHLY TOTAL</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: TEAL }}>${monthlyTools + 150}/mo</span>
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--c-light)", margin: "0.5rem 0 0", lineHeight: 1.5 }}>
            Optional subscription you can activate after signing. Billing only begins once your included support period ends — nothing extra is charged today.
          </p>
        </div>

        {/* Key terms */}
        <p style={{ fontSize: 13, color: "var(--c-mid)", margin: "0 0 0.75rem", fontWeight: 600 }}>By signing, you agree to:</p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem" }}>
          {KEY_TERMS.map((t, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <ShieldCheck size={15} color={TEAL} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: "var(--c-mid)", lineHeight: 1.5 }}>{t}</span>
            </li>
          ))}
        </ul>

        {/* Name */}
        <label style={S.label}>Full Legal Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          style={S.input}
        />

        {/* Signature preview */}
        <label style={{ ...S.label, margin: "1.25rem 0 0.4rem" }}>Your Signature</label>
        <div style={{ border: `2px solid ${name.trim() ? TEAL : "var(--c-border)"}`, borderRadius: 10, background: "var(--c-subtle)", transition: "border-color 0.15s", overflow: "hidden" }}>
          <canvas ref={canvasRef} width={500} height={110} style={{ width: "100%", height: 110, display: "block", borderRadius: 8 }} />
        </div>
        <p style={{ fontSize: 11, color: "var(--c-light)", margin: "4px 0 0", textAlign: "center" }}>
          {name.trim() ? "Signature captured — your typed name is your legal digital signature." : "Your signature will appear here as you type your name above."}
        </p>

        {/* Agree */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", margin: "1.25rem 0" }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 3, accentColor: TEAL, width: 15, height: 15, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--c-mid)", lineHeight: 1.5 }}>
            I have read and understood the Terms &amp; Conditions in this proposal, including that third-party subscriptions and tool costs (hosting, Monday.com, APIs, etc.) are my responsibility and are not included in the project fee. I agree that this digital signature constitutes a legally binding acceptance of all terms.
          </span>
        </label>

        {/* Submit */}
        <button
          onClick={submitSignature}
          disabled={!canSign || stage === "signing"}
          style={{ ...S.btn, background: canSign ? TEAL : "var(--c-border)", color: canSign ? "#fff" : "var(--c-light)", cursor: canSign ? "pointer" : "not-allowed" }}
        >
          {stage === "signing"
            ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</>
            : "Sign Agreement"}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0.45rem 0", borderBottom: last ? "none" : `1px solid var(--c-border)` }}>
      <span style={{ fontSize: 12, color: "var(--c-light)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-dark)" }}>{value}</span>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:  { minHeight: "100vh", background: "var(--c-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" },
  card:  { background: "var(--c-card)", borderRadius: 16, padding: "2rem", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-mid)", letterSpacing: 0.5, marginBottom: 6 },
  input: { width: "100%", padding: "0.7rem 0.9rem", border: "1.5px solid var(--c-border)", borderRadius: 8, fontSize: 14, color: "var(--c-dark)", background: "var(--c-input-bg)", outline: "none", boxSizing: "border-box" },
  btn:   { width: "100%", padding: "0.9rem", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s" },
};
