'use client';

import type { ReactNode } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type UsageRowProps = {
  label: ReactNode;
  value: ReactNode;
  percentageOfLimit: number;
  valueClassName?: string;
};

/**
 * One label / bar / value row. The headline usage row and each breakdown row share it so
 * their bars land in the same column on the same scale, which is what makes the breakdown
 * read as a decomposition of the total above it.
 */
export function UsageRow({ label, value, percentageOfLimit, valueClassName }: UsageRowProps) {
  return (
    <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_minmax(110px,20rem)_7.5rem]'>
      {label}
      <Progress
        value={Math.min(percentageOfLimit, 100)}
        color='var(--primary)'
        className='order-last col-span-2 h-1.5 md:order-none md:col-span-1'
      />
      <span className={cn('text-right text-xs whitespace-nowrap tabular-nums', valueClassName)}>{value}</span>
    </div>
  );
}
