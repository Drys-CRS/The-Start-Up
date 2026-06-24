"use client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, Loader2, PenLine, RotateCcw, CreditCard, ShieldCheck } from "lucide-react";

type Stage = "form" | "signing" | "signed" | "paying" | "error";

const TEAL  = "#14b8a6";
const DARK  = "#0f172a";
const MID   = "#475569";
const LIGHT = "#94a3b8";

const TIER_LABEL: Record<string, string> = {
  promo:   "Promotional — Limited Time",
  premium: "Premium",
};

const AMOUNTS: Record<string, Record<string, { amount: string; label: string }>> = {
  promo: {
    USD: { amount: "$3,000",  label: "Full investment (flat fee)" },
    ZAR: { amount: "R60,000", label: "Full investment (flat fee)" },
  },
  premium: {
    USD: { amount: "$2,500",  label: "50% deposit (R50k balance on delivery)" },
    ZAR: { amount: "R50,000", label: "50% deposit (R50k balance on delivery)" },
  },
};

const KEY_TERMS = [
  "The investment amount and payment schedule as outlined in your proposal",
  "The 30-day build commitment and 60–90 day support period",
  "All Terms & Conditions including scope, confidentiality, and liability",
  "Ownership of all deliverables transfers to you upon final payment",
];

export default function SignPage() {
  const [ref,  setRef]  = useState("");
  const [item, setItem] = useState("");
  const [tier, setTier] = useState("premium");
  const [cur,  setCur]  = useState("USD");

  const [name,   setName]   = useState("");
  const [agreed, setAgreed] = useState(false);
  const [drawn,  setDrawn]  = useState(false);

  const [stage, setStage]   = useState<Stage>("form");
  const [errMsg, setErrMsg] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Read URL params
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setRef(p.get("ref") || "");
    setItem(p.get("item") || "");
    setTier(p.get("t") || "premium");
    setCur(p.get("c") || "USD");
  }, []);

  // Wire up canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = DARK;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    let drawing = false;

    function pos(e: MouseEvent | TouchEvent) {
      const r  = canvas!.getBoundingClientRect();
      const sx = canvas!.width  / r.width;
      const sy = canvas!.height / r.height;
      if ("touches" in e) {
        return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
      }
      return { x: ((e as MouseEvent).clientX - r.left) * sx, y: ((e as MouseEvent).clientY - r.top) * sy };
    }

    function start(e: MouseEvent | TouchEvent) {
      drawing = true; setDrawn(true);
      const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    }
    function move(e: MouseEvent | TouchEvent) {
      if (!drawing) return; e.preventDefault();
      const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    function end() { drawing = false; }

    canvas.addEventListener("mousedown",  start);
    canvas.addEventListener("mousemove",  move);
    canvas.addEventListener("mouseup",    end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove",  move,  { passive: false });
    canvas.addEventListener("touchend",   end);

    return () => {
      canvas.removeEventListener("mousedown",  start);
      canvas.removeEventListener("mousemove",  move);
      canvas.removeEventListener("mouseup",    end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove",  move);
      canvas.removeEventListener("touchend",   end);
    };
  }, []);

  function clearSig() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setDrawn(false);
  }

  async function submitSignature() {
    if (!name.trim() || !drawn || !agreed) return;
    setStage("signing");
    try {
      const sigDataUrl = canvasRef.current!.toDataURL("image/png");
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, item, name, sigDataUrl, tier, cur }),
      });
      if (res.ok) {
        setStage("signed");
      } else {
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
      body: JSON.stringify({ ref, item, tier, cur }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      setErrMsg("Could not start payment — please contact us directly.");
      setStage("error");
    }
  }

  const amountInfo = AMOUNTS[tier]?.[cur] ?? AMOUNTS.premium.USD;
  const canSign    = name.trim().length > 0 && drawn && agreed;

  // ── Signed success screen ──────────────────────────────────────────────────
  if (stage === "signed" || stage === "paying") {
    return (
      <main style={styles.page}>
        <div style={{ ...styles.card, maxWidth: 540 }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <CheckCircle size={52} color={TEAL} style={{ margin: "0 auto 0.75rem" }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: DARK, margin: "0 0 0.4rem" }}>
              Agreement Signed
            </h1>
            <p style={{ color: MID, fontSize: 14, margin: 0 }}>
              Your signature has been recorded and attached to your scope lock record.
            </p>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <Row label="Reference"    value={ref || "—"} />
            <Row label="Signed by"    value={name} />
            <Row label="Date"         value={new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })} />
            <Row label="Package"      value={TIER_LABEL[tier] ?? tier} last />
          </div>

          <div style={{ borderTop: "1.5px solid #e2e8f0", paddingTop: "1.5rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 0.4rem" }}>
              Complete Your Payment
            </h2>
            <p style={{ color: MID, fontSize: 13, margin: "0 0 1rem" }}>
              {amountInfo.label}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: 10,
              padding: "0.85rem 1.25rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: TEAL }}>{amountInfo.amount}</span>
              <span style={{ fontSize: 12, color: MID }}>{cur}</span>
            </div>
            <button
              onClick={startPayment}
              disabled={stage === "paying"}
              style={{ ...styles.btn, background: TEAL, color: "#fff", cursor: "pointer" }}
            >
              {stage === "paying"
                ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Redirecting...</>
                : <><CreditCard size={17} /> Pay {amountInfo.amount}</>}
            </button>
            <p style={{ color: LIGHT, fontSize: 11, textAlign: "center", marginTop: "0.6rem" }}>
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
      <main style={styles.page}>
        <div style={{ ...styles.card, maxWidth: 440, textAlign: "center" }}>
          <AlertCircle size={48} color="#dc2626" style={{ margin: "0 auto 1rem" }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: DARK, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: MID, fontSize: 14, marginBottom: "1.5rem" }}>{errMsg}</p>
          <button onClick={() => setStage("form")} style={{ ...styles.btn, background: TEAL, color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <main style={styles.page}>
      <div style={{ ...styles.card, maxWidth: 580 }}>

        {/* Header */}
        <div style={{ background: DARK, margin: "-2rem -2rem 1.75rem", borderRadius: "16px 16px 0 0", padding: "1.5rem 2rem" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: 2, marginBottom: 6 }}>THE STARTUP</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Scope Lock Agreement</h1>
          {ref && <div style={{ fontSize: 12, color: LIGHT }}>Reference: {ref}</div>}
        </div>

        {/* Package summary */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: 10,
          padding: "0.85rem 1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, marginBottom: 2 }}>SELECTED PACKAGE</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{TIER_LABEL[tier] ?? tier}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEAL }}>{amountInfo.amount}</div>
            <div style={{ fontSize: 11, color: MID }}>{amountInfo.label}</div>
          </div>
        </div>

        {/* Key terms */}
        <p style={{ fontSize: 13, color: MID, margin: "0 0 0.75rem", fontWeight: 600 }}>By signing, you agree to:</p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem" }}>
          {KEY_TERMS.map((t, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <ShieldCheck size={15} color={TEAL} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: MID, lineHeight: 1.5 }}>{t}</span>
            </li>
          ))}
        </ul>

        {/* Name field */}
        <label style={styles.label}>Full Legal Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          style={styles.input}
        />

        {/* Signature canvas */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "1.25rem 0 0.4rem" }}>
          <label style={{ ...styles.label, margin: 0 }}>
            <PenLine size={13} style={{ display: "inline", marginRight: 5, color: TEAL }} />
            Draw Your Signature
          </label>
          {drawn && (
            <button onClick={clearSig} style={{ background: "none", border: "none", cursor: "pointer", color: LIGHT, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>
        <div style={{ border: `2px solid ${drawn ? TEAL : "#cbd5e1"}`, borderRadius: 10,
          background: "#fafafa", cursor: "crosshair", transition: "border-color 0.15s" }}>
          <canvas ref={canvasRef} width={500} height={130} style={{ width: "100%", height: 130, display: "block", borderRadius: 8 }} />
        </div>
        {!drawn && <p style={{ fontSize: 11, color: LIGHT, margin: "4px 0 0", textAlign: "center" }}>Sign with your mouse or finger</p>}

        {/* Agreement checkbox */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", margin: "1.25rem 0" }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 3, accentColor: TEAL, width: 15, height: 15, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: MID, lineHeight: 1.5 }}>
            I have read and understood the Terms & Conditions in this proposal and agree that this digital signature constitutes a legally binding acceptance of all terms.
          </span>
        </label>

        {/* Submit */}
        <button
          onClick={submitSignature}
          disabled={!canSign || stage === "signing"}
          style={{
            ...styles.btn,
            background: canSign ? TEAL : "#e2e8f0",
            color:      canSign ? "#fff" : LIGHT,
            cursor:     canSign ? "pointer" : "not-allowed",
          }}
        >
          {stage === "signing"
            ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</>
            : "Sign Agreement"}
        </button>

        {!item && (
          <p style={{ color: "#f59e0b", fontSize: 12, marginTop: "0.75rem", textAlign: "center" }}>
            No proposal record linked. Please use the link from your PDF.
          </p>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0.45rem 0", borderBottom: last ? "none" : "1px solid #e2e8f0" }}>
      <span style={{ fontSize: 12, color: LIGHT }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:  { minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" },
  card:  { background: "#fff", borderRadius: 16, padding: "2rem", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: MID, letterSpacing: 0.5, marginBottom: 6 },
  input: { width: "100%", padding: "0.7rem 0.9rem", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: DARK, outline: "none", boxSizing: "border-box" },
  btn:   { width: "100%", padding: "0.9rem", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s" },
};
