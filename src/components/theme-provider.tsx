import * as React from "react";
import { ScriptOnce } from "@tanstack/react-router";

export type UserTheme = "light" | "dark" | "system";
export type AppTheme = Exclude<UserTheme, "system">;

const THEME_STORAGE_KEY = "theme";
const VALID_THEMES: UserTheme[] = ["light", "dark", "system"];

// Blocking script that runs before React hydration
const themeScript = (() => {
  function setThemeClass() {
    try {
      const stored = localStorage.getItem("theme") || "system";
      const theme = ["light", "dark", "system"].includes(stored) ? stored : "system";

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        document.documentElement.classList.add(systemTheme);
      } else {
        document.documentElement.classList.add(theme);
      }
    } catch {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      document.documentElement.classList.add(systemTheme);
    }
  }
  return `(${setThemeClass.toString()})();`;
})();

function getStoredTheme(): UserTheme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored && VALID_THEMES.includes(stored as UserTheme)
      ? (stored as UserTheme)
      : "system";
  } catch {
    return "system";
  }
}

function getSystemTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

type ThemeContextValue = {
  userTheme: UserTheme;
  appTheme: AppTheme;
  setTheme: (theme: UserTheme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function applyTheme(userTheme: UserTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");

  const appTheme = userTheme === "system" ? getSystemTheme() : userTheme;
  root.classList.add(appTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [userTheme, setUserTheme] = React.useState<UserTheme>(getStoredTheme);

  // Listen for system theme changes when in system mode
  React.useEffect(() => {
    if (userTheme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [userTheme]);

  const appTheme = userTheme === "system" ? getSystemTheme() : userTheme;

  const setTheme = React.useCallback((newTheme: UserTheme) => {
    setUserTheme(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
    applyTheme(newTheme);
  }, []);

  return (
    <ThemeContext value={{ userTheme, appTheme, setTheme }}>
      <ScriptOnce>{themeScript}</ScriptOnce>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
