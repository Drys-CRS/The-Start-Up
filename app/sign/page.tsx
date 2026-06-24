"use client";
import React, { useEffect, useRef, useState } from "react";
import { FileText, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SignPage() {
  const [ref, setRef]   = useState("");
  const [item, setItem] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setRef(p.get("ref") || "");
    setItem(p.get("item") || "");
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
  }

  async function submit() {
    if (!file || !item) return;
    setStatus("uploading");
    const form = new FormData();
    form.append("file", file);
    form.append("ref", ref);
    form.append("item", item);
    const res = await fetch("/api/sign", { method: "POST", body: form });
    setStatus(res.ok ? "done" : "error");
  }

  const teal = "#14b8a6";

  if (status === "done") {
    return (
      <main style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "3rem 2.5rem", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          <CheckCircle size={52} color={teal} style={{ margin: "0 auto 1.25rem" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>
            Signed Proposal Received
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 1rem" }}>
            Your signed proposal has been submitted and attached to your scope lock record. The Startup team will review and be in touch shortly.
          </p>
          {ref && (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Reference: {ref}</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "3rem 2.5rem", maxWidth: 520, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.75rem" }}>
          <div style={{ background: "#f0fdfa", borderRadius: 12, padding: 10 }}>
            <FileText size={24} color={teal} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Return Your Signed Proposal
            </h1>
            {ref && (
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>
                Reference: {ref}
              </p>
            )}
          </div>
        </div>

        <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Print, sign, and scan (or photograph) your proposal, then upload it below.
          Your signed copy will be attached directly to your scope lock record.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${drag ? teal : "#cbd5e1"}`,
            borderRadius: 12,
            padding: "2rem 1.5rem",
            textAlign: "center",
            cursor: "pointer",
            background: drag ? "#f0fdfa" : "#f8fafc",
            transition: "all 0.15s",
            marginBottom: "1.25rem",
          }}
        >
          <Upload size={28} color={file ? teal : "#94a3b8"} style={{ margin: "0 auto 0.75rem" }} />
          {file ? (
            <p style={{ color: "#0f172a", fontSize: 14, fontWeight: 600, margin: 0 }}>
              {file.name}
            </p>
          ) : (
            <>
              <p style={{ color: "#475569", fontSize: 14, margin: "0 0 4px", fontWeight: 600 }}>
                Drop your signed PDF here
              </p>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>or click to browse</p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {status === "error" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", fontSize: 13, marginBottom: "1rem" }}>
            <AlertCircle size={16} />
            Upload failed — please try again or email your signed copy to us.
          </div>
        )}

        <button
          onClick={submit}
          disabled={!file || !item || status === "uploading"}
          style={{
            width: "100%",
            padding: "0.85rem",
            background: file && item ? teal : "#e2e8f0",
            color: file && item ? "#fff" : "#94a3b8",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: file && item ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.15s",
          }}
        >
          {status === "uploading" ? (
            <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Uploading...</>
          ) : (
            <><Upload size={18} /> Submit Signed Proposal</>
          )}
        </button>

        {!item && (
          <p style={{ color: "#f59e0b", fontSize: 12, marginTop: "0.75rem", textAlign: "center" }}>
            No proposal reference found in this link. Please use the link from your PDF.
          </p>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  );
}
