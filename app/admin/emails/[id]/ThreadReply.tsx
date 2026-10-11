"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { replyInThread } from "./actions";

export default function ThreadReply({
  emailId,
  to,
  replyable,
  signature,
}: {
  emailId: string;
  to: string;
  replyable: boolean;
  signature: string;
}) {
  const [body, setBody] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
        Reply{to ? ` to ${to}` : ""}
      </h2>
      {!replyable && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Nothing in this conversation came through the mailbox, so the reply will start a new thread rather than
          continue this one.
        </p>
      )}

      <textarea
        rows={7}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your reply. The sign-off is added for you."
        className="mt-3 w-full rounded-lg border-2 border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />

      {/* Shown so nobody wonders what is about to be appended to their words. */}
      <div className="mt-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 dark:border-slate-700">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Signed off with
        </p>
        <pre className="mt-1 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {signature}
        </pre>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          disabled={pending || !body.trim()}
          onClick={() =>
            start(async () => {
              const r = await replyInThread(emailId, body);
              setResult(r);
              if (r.ok) setBody("");
            })
          }
          className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {pending ? "Sending" : "Send reply"}
        </button>
        {result && (
          <span className={`text-sm ${result.ok ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400"}`}>
            {result.message}
          </span>
        )}
      </div>
    </section>
  );
}
