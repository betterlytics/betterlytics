'use client';

import { useTheme } from 'next-themes';
import RetroGrid from '@/components/ui/retro-grid';
import { GlobeBackground } from '@/components/ui/globe-background';

export function HeroGlobe() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const logoSrc = isDark ? '/images/favicon-light.svg' : '/images/favicon-dark.svg';

  return (
    <div className='relative h-full w-full'>
      <RetroGrid
        gridColor={isDark ? '#3b82f6' : '#93c5fd'}
        bgColor={isDark ? '#0a0a0f' : '#f9f9f9'}
        showScanlines={false}
        glowEffect={true}
        className='absolute bottom-[5vh]'
      />
      <div className='relative h-full w-full'>
        <GlobeBackground className='h-full w-full' logoSrc={logoSrc} />
      </div>
    </div>
  );
}
