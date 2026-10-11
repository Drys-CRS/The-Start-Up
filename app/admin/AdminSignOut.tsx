"use client";

import { LogOut } from "lucide-react";

export default function AdminSignOut() {
  async function out() {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      // the cookie expires on its own in twelve hours
    }
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={out}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
    >
      <LogOut className="h-3.5 w-3.5" /> Sign out
    </button>
  );
}
