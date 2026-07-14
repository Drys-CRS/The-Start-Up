"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const dark = resolvedTheme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle light/dark mode"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
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
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "sun" : "moon"}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex" }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
