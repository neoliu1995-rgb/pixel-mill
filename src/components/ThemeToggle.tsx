"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "pixelmill_theme";
type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(THEME_KEY) as Theme;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const applyTheme = () => {
      let resolvedTheme: "light" | "dark";
      
      if (theme === "system") {
        resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        resolvedTheme = theme;
      }

      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
      localStorage.setItem(THEME_KEY, theme);
    };

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme, isMounted]);

  const toggleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getIcon = () => {
    if (!isMounted) return <Sun className="w-5 h-5" />;
    if (theme === "dark") return <Moon className="w-5 h-5" />;
    if (theme === "light") return <Sun className="w-5 h-5" />;
    return (
      <div className="relative">
        <Sun className="w-5 h-5" />
        <Moon className="w-3 h-3 absolute -bottom-1 -right-1 opacity-60" />
      </div>
    );
  };

  const getLabel = () => {
    if (!isMounted) return "加载中...";
    if (theme === "dark") return "深色模式";
    if (theme === "light") return "浅色模式";
    return "跟随系统";
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      title={isMounted ? getLabel() : "主题切换"}
    >
      {getIcon()}
      <span className="text-sm font-medium text-gray-600">
        {getLabel()}
      </span>
    </button>
  );
}