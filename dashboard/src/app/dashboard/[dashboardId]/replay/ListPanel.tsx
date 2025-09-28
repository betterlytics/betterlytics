'use client';

import { cn } from '@/lib/utils';

type ListPanelProps = {
  title: string;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function ListPanel({ title, subtitle, headerRight, className, children }: ListPanelProps) {
  return (
    <div
      className={cn(
        'bg-muted/40 border-border/60 flex h-full min-h-0 flex-col overflow-hidden rounded-lg border',
        className,
      )}
    >
      <div className='bg-muted/60 sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-3'>
        <div>
          <h3 className='text-foreground text-sm font-medium tracking-tight'>{title}</h3>
          {subtitle ? <p className='text-muted-foreground mt-1 text-xs'>{subtitle}</p> : null}
        </div>
        {headerRight ? <div className='shrink-0'>{headerRight}</div> : null}
      </div>
      <div className='flex-1 overflow-y-auto px-2 py-2'>{children}</div>
    </div>
  );
}
