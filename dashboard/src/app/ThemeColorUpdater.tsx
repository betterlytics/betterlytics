'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeColorUpdater() {
  const { theme, systemTheme } = useTheme();

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
