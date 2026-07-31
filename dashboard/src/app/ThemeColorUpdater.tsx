'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { baGlobalProperties } from '@/lib/ba-event';

export default function ThemeColorUpdater() {
  const { theme, systemTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme) {
      baGlobalProperties({ theme: resolvedTheme });
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;

    requestAnimationFrame(() => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
      if (bg) {
        meta.setAttribute('content', bg);
      }
    });
  }, [theme, systemTheme]);

  return null;
}
