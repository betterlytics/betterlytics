'use client';

import { useTheme } from 'next-themes';
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation';

export function HeroSmoke() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <SmokeBackground
      smokeColor={isDark ? '#1d4ed8' : '#3b82f6'}
      bgColor={isDark ? '#101114' : '#f9f9f9'}
    />
  );
}
