'use client';

import { cn } from '@/lib/utils';

type StatusDotProps = {
  toneClass: string;
  label?: string;
  size?: 'sm' | 'md';
};

export function StatusDot({ toneClass, label, size = 'md' }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  return <span className={cn('inline-block rounded-full', sizeClass, toneClass)} aria-label={label} />;
}
