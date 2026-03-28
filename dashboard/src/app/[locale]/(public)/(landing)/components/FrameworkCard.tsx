'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DotGrid } from '@/components/animations/DotGrid';

type FrameworkCardProps = {
  name: string;
  logo: string;
  color: string;
};

export function FrameworkCard({ name, logo, color }: FrameworkCardProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div
      tabIndex={0}
      aria-label={name}
      className="group relative flex min-w-[120px] flex-shrink-0 flex-col items-center justify-center rounded-lg border border-transparent p-6 transition-[border-color,background-color] duration-300 hover:border-border hover:bg-card focus-within:border-border focus-within:bg-card"
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
    >
      <DotGrid
        color={color}
        active={isActive}
        gap={12}
        dotRadius={1}
        className="absolute inset-0 overflow-hidden rounded-lg"
      />

      <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-[--dot-grid-overlay] to-transparent to-[70%] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />

      <div className="relative flex flex-col items-center">
        <div
          className="transition-transform duration-300 ease-out"
          style={{ transform: isActive ? 'translateY(0px)' : 'translateY(8px)' }}
        >
          <Image
            src={logo}
            alt={`${name} logo`}
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
          {name}
        </span>
      </div>
    </div>
  );
}
