"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import WordMark from "@/components/WordMark";

// Where the emailed link lands.
//
// This page does nothing on load. It shows a button, and only pressing it
// spends the token. That is the entire reason the page exists: corporate mail
// filters follow links in incoming messages to see where they go, and a
// one-time token spent by a scanner at 4am is a token the customer never gets
// to use. The CRS partner portal learned this and put /confirm-login in front
// of its magic links for the same reason.
//
// So: no auto-submit, no useEffect that signs anyone in, however much quicker
// that would feel.
export default function EnterPortal() {
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
      const res = await fetch("/api/portal/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        // Replace, so the back button does not return to a spent token.
        window.location.replace("/status");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "That link did not work. Request a new one.");
      setState("error");
    } catch {
      setError("Could not reach us just now. Check your connection and try again.");
      setState("error");
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-5 py-12 font-sans dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
        <Link href="/" aria-label="The Start Up home" className="inline-block">
          <WordMark className="scale-75 origin-left" />
        </Link>

        {token === null ? (
          <p className="mt-7 text-sm text-slate-500 dark:text-slate-400">Checking your link.</p>
        ) : !token ? (
          <>
            <h1 className="mt-7 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              This link is incomplete
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Some email clients cut long links in half. Request a new one and open it from the email rather than
              copying it across.
            </p>
            <Link
              href="/status"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400"
            >
              Request a new link <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : state === "error" ? (
          <>
            <h1 className="mt-7 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              That did not work
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{error}</p>
            <Link
              href="/status"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400"
            >
              Request a new link <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-7 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Open your portal
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Press the button to sign in. The link works once, so we wait for you rather than using it up when the
              email is scanned.
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
                  Open my portal <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" />
              Stays signed in on this device for two weeks. Sign out any time from inside the portal.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
