'use client';

import type { ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const DOT_GRID = {
  backgroundImage:
    'radial-gradient(circle, color-mix(in srgb, currentColor 18%, transparent) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

type HeatmapFrameProps = {
  info?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

/** The heatmap's fixed-size frame: a bar for what is shown and the capture actions, over a dotted canvas */
export function HeatmapFrame({ info, actions, children }: HeatmapFrameProps) {
  return (
    <div className='bg-card flex h-[calc(100svh-13rem)] min-h-[28rem] flex-col overflow-hidden rounded-lg border shadow-sm'>
      {(info || actions) && (
        <div className='bg-muted/60 border-border/60 flex min-h-11 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b px-2 py-1.5 text-xs'>
          <div className='flex max-w-full min-w-0 items-center gap-1.5'>{info}</div>
          <div className='ml-auto flex shrink-0 items-center gap-1.5'>{actions}</div>
        </div>
      )}
      <div
        className='text-muted-foreground relative min-h-0 flex-1 bg-black/[0.03] dark:bg-black/30'
        style={DOT_GRID}
      >
        {children}
      </div>
    </div>
  );
}

export function FrameSpinner() {
  return (
    <div className='flex h-full items-center justify-center'>
      <Spinner size='sm' />
    </div>
  );
}

type FrameMessageProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
};

export function FrameMessage({ icon, title, description, children }: FrameMessageProps) {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-4 p-6 text-center'>
      <div className='bg-card text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full border shadow-sm'>
        {icon}
      </div>
      <div className='space-y-1'>
        <p className='text-foreground text-sm font-medium'>{title}</p>
        {description && <p className='text-muted-foreground text-xs'>{description}</p>}
      </div>
      {children}
    </div>
  );
}

type FrameLabelProps = {
  icon: ReactNode;
  label: string;
  hint?: string;
};

export function FrameLabel({ icon, label, hint }: FrameLabelProps) {
  const content = (
    <span
      className={cn('text-muted-foreground flex min-w-0 items-center gap-1.5 px-1.5', hint && 'cursor-default')}
    >
      <span className='shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5'>{icon}</span>
      <span className='truncate'>{label}</span>
    </span>
  );
  if (!hint) return content;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side='bottom' className='max-w-xs'>
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

type FrameBadgeProps = {
  icon: ReactNode;
  label: string;
  hint: string;
  tone?: 'muted' | 'warning';
};

export function FrameBadge({ icon, label, hint, tone = 'muted' }: FrameBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'flex shrink-0 cursor-default items-center gap-1 rounded-md border px-1.5 py-0.5 whitespace-nowrap [&_svg]:h-3 [&_svg]:w-3',
            tone === 'warning'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'border-border/50 bg-muted/40 text-muted-foreground',
          )}
        >
          {icon}
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side='bottom' className='max-w-xs'>
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}
