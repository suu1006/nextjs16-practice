"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Analytics } from "@vercel/analytics/react";

export default function Home() {
  return (
    <main>
      <ThemeToggle />
      <Analytics />
    </main>
  );
}
