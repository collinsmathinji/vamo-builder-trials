"use client";

import { createContext, useContext, useEffect, useState } from "react";

const THEME_KEY = "vamo-theme";
type Theme = "light" | "dark" | "system";

function getSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

function getEffectiveDark(theme: Theme): boolean {
  if (theme === "light") return false;
  if (theme === "dark") return true;
  return getSystemDark();
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedDark, setResolvedDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setResolvedDark(getEffectiveDark(getStoredTheme()));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dark = getEffectiveDark(theme);
    setResolvedDark(dark);
    applyTheme(dark);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      setResolvedDark(getSystemDark());
      applyTheme(getSystemDark());
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [mounted, theme]);

  const setTheme = (next: Theme) => {
    localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
    const dark = getEffectiveDark(next);
    applyTheme(dark);
    setResolvedDark(dark);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
