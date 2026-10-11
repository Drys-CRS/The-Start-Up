"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

// Sign in to the admin portal. Reachable without a session: the middleware
// lets /admin/login and /admin/enter through, and nothing else under /admin.
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/admin/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(d.message || "Check your email.");
        setState("sent");
      } else {
        setMessage(d.error || "Could not send that. Try again shortly.");
        setState("error");
      }
    } catch {
      setMessage("Network error. Check your connection and try again.");
      setState("error");
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-5 py-12 font-sans dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
        <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
          The Start Up
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Admin sign-in</h1>

        {state === "sent" ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
            <button
              onClick={() => { setState("idle"); setMessage(""); }}
              className="mt-5 text-sm font-semibold text-teal-600 hover:underline dark:text-teal-400"
            >
              Use a different address
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We email you a link. No password to share, and no password to leak.
            </p>
            <form onSubmit={submit} className="mt-5">
              <label htmlFor="admin-email" className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Work email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@cyberretaliatorsolutions.com"
                className="mt-1.5 w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={state === "sending" || !email.trim()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-60"
              >
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {state === "sending" ? "Sending" : "Email me a link"}
              </button>
            </form>
            {state === "error" && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{message}</p>}
          </>
        )}
      </div>
    </main>
  );
}
