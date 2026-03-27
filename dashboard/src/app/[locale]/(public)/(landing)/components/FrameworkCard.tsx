'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { DotGrid } from '@/components/animations/DotGrid';

type Framework = {
  name: string;
  logo: string;
  brandColor: string | { light: string; dark: string };
};

export function FrameworkCard({ framework }: { framework: Framework }) {
  const [isActive, setIsActive] = useState(false);
  const { resolvedTheme } = useTheme();
  const dotColor =
    typeof framework.brandColor === 'string'
      ? framework.brandColor
      : resolvedTheme === 'dark'
        ? framework.brandColor.dark
        : framework.brandColor.light;

  return (
    <div
      className="group relative flex min-w-[120px] flex-shrink-0 flex-col items-center justify-center rounded-lg border border-transparent p-6 transition-[border-color,background-color] duration-300 hover:border-border hover:bg-card focus-within:border-border focus-within:bg-card"
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
    >
      {/* Layer 1: Dot grid canvas */}
      <DotGrid
        color={dotColor}
        active={isActive}
        gap={12}
        dotRadius={1}
        className="absolute inset-0 overflow-hidden rounded-lg"
      />

      {/* Layer 2: Gradient overlay to keep logo readable */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t to-transparent to-[70%] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ '--tw-gradient-from': 'var(--dot-grid-overlay)' } as React.CSSProperties}
      />

      {/* Layer 3: Logo + label */}
      <div className="relative flex flex-col items-center">
        <div
          className="transition-transform duration-300 ease-out"
          style={{ transform: isActive ? 'translateY(0px)' : 'translateY(8px)' }}
        >
          <Image
            src={framework.logo}
            alt={`${framework.name} logo`}
            width={32}
            height={32}
            className="h-8 w-8"
          />
        </div>

        <span
          className="mt-2 text-center text-sm font-medium transition-opacity duration-300"
          style={{
            opacity: isActive ? 1 : 0,
            transitionDelay: isActive ? '75ms' : '0ms',
          }}
        >
          {framework.name}
        </span>
      </div>
    </div>
  );
}
