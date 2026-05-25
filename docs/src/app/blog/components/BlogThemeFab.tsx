"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function BlogThemeFab() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div className="pointer-events-auto fixed right-6 bottom-6 z-50">
      <div className="bg-muted/70 supports-[backdrop-filter]:bg-muted/50 border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur transition-colors">
        <button
          type="button"
          aria-label="Switch to light mode"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            mounted && !isDark ? "bg-primary/30 text-foreground" : ""
          }`}
          onClick={() => setTheme("light")}
        >
          <SunIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Switch to dark mode"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            mounted && isDark ? "bg-primary/60 text-foreground" : ""
          }`}
          onClick={() => setTheme("dark")}
        >
          <MoonIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
