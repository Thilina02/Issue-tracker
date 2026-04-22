"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <button className="rounded-full border px-4 py-2 text-sm">Theme</button>;
  }

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border border-white/20 bg-white/70 px-4 py-2 text-sm backdrop-blur dark:bg-black/40"
    >
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
