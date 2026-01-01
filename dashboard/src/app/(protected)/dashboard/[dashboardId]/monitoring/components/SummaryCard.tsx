'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Label } from '@/components/text';
import { type ReactNode } from 'react';

type SummaryCardProps = {
  title: string;
  headerRight?: ReactNode;
  helper?: ReactNode;
  children: ReactNode;
  className?: string;
  gap?: string;
  bodyClassName?: string;
};

export function SummaryCard({
  title,
  headerRight,
  helper,
  children,
  className,
  gap = 'gap-2',
  bodyClassName = 'flex flex-1 items-center',
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        'border-border/70 bg-card/80 flex h-full flex-col p-2.5 shadow-lg shadow-black/10 sm:p-4',
        gap,
        className,
      )}
    >
      <div className='flex items-center justify-between gap-2'>
        <Label>{title}</Label>
        {headerRight}
      </div>
      <div className={bodyClassName}>{children}</div>
      {helper && <div className='text-muted-foreground mt-1 text-xs sm:text-sm'>{helper}</div>}
    </Card>
  );
}
