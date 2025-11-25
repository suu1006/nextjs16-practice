"use client";

import { useThemeStore } from "../store/use-theme";

export default function DashboardPage() {
  const theme = useThemeStore((state) => state.theme);
  const hasHydrated = useThemeStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return null;
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Current theme: {theme}</p>
    </main>
  );
}
