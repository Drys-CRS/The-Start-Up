"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

// Where the admin link lands. Same reasoning as /status/enter: nothing happens
// on load, because a mail scanner that follows the link would otherwise spend
// the token before anyone reads the message.
export default function AdminEnter() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("t"));
  }, []);

  async function signIn() {
    if (!token) return;
    setState("working");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        window.location.replace("/admin");
        return;
      }
      const d = await res.json().catch(() => ({}));
      setError(d.error || "That link did not work.");
      setState("error");
    } catch {
      setError("Could not reach the server. Try again.");
      setState("error");
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-5 py-12 font-sans dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
        <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
          The Start Up
        </p>

        {token === null ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Checking your link.</p>
        ) : !token || state === "error" ? (
          <>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {token ? "That did not work" : "This link is incomplete"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {token ? error : "Some email clients cut long links in half. Request a new one."}
            </p>
            <Link
              href="/admin/login"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400"
            >
              Request a new link <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Open the admin portal
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Press to sign in. Signs you in for twelve hours.
            </p>
            <button
              onClick={signIn}
              disabled={state === "working"}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-60"
            >
              {state === "working" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing you in
                </>
              ) : (
                <>
                  Open the admin portal <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
