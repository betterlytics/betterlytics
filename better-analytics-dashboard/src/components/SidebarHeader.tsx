"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useState, useEffect } from "react";

export function SidebarHeader() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = theme === "light" ? "/betterlytics-logo-dark-simple.svg" : "/betterlytics-logo-light-simple.svg";

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!mounted ? (
            <div style={{ width: 32, height: 32 }} />
          ) : (
            <Image
              key={theme}
              src={logoSrc}
              alt="Betterlytics Logo"
              width={32}
              height={32}
            />
          )}
          <div>
            <div className="font-bold text-sm text-foreground">Betterlytics</div>
          </div>
        </div>
        <ThemeSwitcher />
      </div>
    </div>
  );
} 