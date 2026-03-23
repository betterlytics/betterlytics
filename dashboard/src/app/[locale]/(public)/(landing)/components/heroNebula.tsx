'use client';

import { useTheme } from 'next-themes';
import { NebulaBackground } from '@/components/ui/nebula-shader';

export function HeroNebula() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <NebulaBackground
      bgColor={isDark ? '#101114' : '#f9f9f9'}
      className='block h-full w-full'
    />
  );
}
