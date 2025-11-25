"use client";

import { useThemeStore } from "./store/use-theme";
import { useEffect } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}
export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme);
  const hasHydrated = useThemeStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hasHydrated]);

  if (!hasHydrated) {
    // zustand가 로컬스토리지에서 테마 값을 아직 못 읽었으면
    // 애플리케이션을 먼저 렌더하지 않음 (깜빡임 방지)
    return null;
  }

  return <>{children}</>;
}
