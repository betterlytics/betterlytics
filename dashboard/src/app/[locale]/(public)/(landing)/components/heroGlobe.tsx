'use client';

import { useTheme } from 'next-themes';
import RetroGrid from '@/components/ui/retro-grid';
import { GlobeBackground } from '@/components/ui/globe-background';
import { BGPattern } from '@/components/ui/bg-pattern';
import { useHeroBackground, type HeroGradient } from '@/components/landing/background-context';

const gradientStyles = (isDark: boolean): Record<HeroGradient, React.CSSProperties> => {
  const bg = isDark ? '10,10,15' : '249,249,249';
  const blue = isDark ? '30,64,175' : '59,130,246';

  return {
    'bottom-fade': {
      background: `linear-gradient(to top, rgba(${bg},1) 0%, rgba(${bg},0.8) 25%, rgba(${bg},0) 60%)`,
    },
    'text-spotlight': {
      background: `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(${bg},0.85) 0%, rgba(${bg},0.4) 50%, transparent 80%)`,
    },
    'radial-center': {
      background: `radial-gradient(circle at 50% 50%, rgba(${bg},0.9) 0%, rgba(${bg},0.3) 40%, transparent 70%)`,
    },
    'top-vignette': {
      background: `linear-gradient(to bottom, rgba(${bg},1) 0%, rgba(${bg},0.6) 20%, transparent 50%)`,
    },
    'blue-wash': {
      background: `radial-gradient(ellipse 80% 60% at 50% 45%, rgba(${blue},0.25) 0%, rgba(${blue},0.08) 50%, transparent 80%)`,
    },
  };
};

export function HeroGlobe() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const logoSrc = isDark ? '/images/favicon-light.svg' : '/images/favicon-dark.svg';
  const { background, gradients } = useHeroBackground();

  const patternFill = isDark ? 'hsl(222, 20%, 25%)' : 'hsl(220, 20%, 82%)';
  const styles = gradientStyles(isDark);

  return (
    <div className='relative h-full w-full'>
      {background === 'retro-grid' && (
        <RetroGrid
          gridColor={isDark ? '#3b82f6' : '#93c5fd'}
          bgColor={isDark ? '#0a0a0f' : '#f9f9f9'}
          showScanlines={false}
          glowEffect={true}
          className='absolute bottom-[5vh]'
        />
      )}
      {(background === 'grid' || background === 'dots' || background === 'diagonal-stripes') && (
        <BGPattern
          variant={background}
          mask='fade-edges'
          size={background === 'dots' ? 20 : 32}
          fill={patternFill}
          className='z-0'
        />
      )}
      {Array.from(gradients).map((g) => (
        <div
          key={g}
          className='pointer-events-none absolute inset-0 z-[1]'
          style={styles[g]}
        />
      ))}
      <div className='relative z-[2] h-full w-full'>
        <GlobeBackground className='h-full w-full' logoSrc={logoSrc} />
      </div>
    </div>
  );
}
