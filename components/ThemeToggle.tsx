"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer
        var-nav-icon hover:bg-[var(--nav-hover-bg)] active:scale-90 ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-4.5 h-4.5 text-amber-400" />
      ) : (
        <Moon className="w-4.5 h-4.5" style={{ color: "var(--nav-icon-color)" }} />
      )}
    </button>
  );
}
