'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type ReactNode } from 'react';

type MonitoringTooltipProps = {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export function MonitoringTooltip({ title, description, children, side = 'top' }: MonitoringTooltipProps) {
  return (
    <Tooltip delayDuration={0} disableHoverableContent>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        className='border-border bg-popover/95 text-popover-foreground pointer-events-none rounded-lg border p-2.5 shadow-xl backdrop-blur-sm'
      >
        <div className='space-y-0.5'>
          <div className='text-popover-foreground text-xs font-semibold'>{title}</div>
          <div className='text-popover-foreground/90 text-sm font-medium'>{description}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
