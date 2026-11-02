import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

// No per-card hover clearing; MapBackgroundLayer handles it
const BASE = 'rounded-md border shadow-md';

const TONES = {
  default: 'border-border bg-card dark:bg-(--card-interactive)',
  warning: 'border-amber-200 bg-amber-50',
} as const;

export const MAP_CARD_CLASS = cn(BASE, TONES.default);

type MapCardProps = ComponentProps<'div'> & { tone?: keyof typeof TONES };

export default function MapCard({ tone = 'default', className, ...props }: MapCardProps) {
  return <div className={cn(BASE, TONES[tone], className)} {...props} />;
}
