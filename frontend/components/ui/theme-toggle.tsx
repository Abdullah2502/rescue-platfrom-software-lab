"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("nexora-theme", next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="group inline-flex h-11 items-center gap-2 rounded-full border border-slate-800 bg-slate-900/95 px-3 text-slate-300 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)] backdrop-blur-xl transition hover:border-red-500/50 hover:text-slate-100"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="text-xs font-semibold">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
