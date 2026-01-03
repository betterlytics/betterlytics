'use client';

import { Badge } from '@/components/ui/badge';
import { type ReactNode } from 'react';

type TimePeriodBadgeProps = {
  children: ReactNode;
};

export function TimePeriodBadge({ children }: TimePeriodBadgeProps) {
  return (
    <Badge variant='secondary' className='border-border/60 bg-muted/30 text-foreground/80 px-2.5 py-1 text-xs'>
      {children}
    </Badge>
  );
}
