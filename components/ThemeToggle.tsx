"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const dark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle light/dark mode"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: `1.5px solid ${dark ? "#334155" : "#e2e8f0"}`,
        background: dark ? "#1e293b" : "#ffffff",
        color: dark ? "#94a3b8" : "#475569",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
