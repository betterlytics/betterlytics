'use client';

import { List, RowComponentProps } from 'react-window';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';

type ListPanelProps = {
  title: string;
  onJump: (timestamp: number) => void;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  groups?: TimelineGroup[];
  empty?: React.ReactNode;
  listClassName?: string;
};

export type ListPanelItem = {
  group: TimelineGroup;
  isActive: boolean;
};

export function ListPanel({
  title,
  subtitle,
  headerRight,
  className,
  children,
  groups,
  empty,
  listClassName,
  onJump,
}: ListPanelProps) {
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
      <div className='max-h-svh flex-1 px-2 py-2'>
        {groups ? (
          groups.length === 0 ? (
            (empty ?? null)
          ) : (
            <List
              rowComponent={RenderGroup}
              rowCount={groups.length}
              rowHeight={40}
              rowProps={useMemo(() => ({ groups, onJump }), [groups, onJump])}
            />
          )
        ) : (
          children
        )}
      </div>
    </div>
  );
}

type TimelineGroup = {
  id: string;
  label: string;
  count: number;
  start: number;
  end: number;
  jumpTo: number;
  icon: React.ReactNode;
};

type RenderGroupProps = RowComponentProps<{
  groups: TimelineGroup[];
  onJump: (timestamp: number) => void;
}>;

function RenderGroup({ groups, onJump, index, style }: RenderGroupProps) {
  const group = groups[index];
  return (
    <button
      type='button'
      onClick={() => onJump(group.jumpTo)}
      style={style as React.CSSProperties}
      className={cn(
        'hover:bg-primary/10 focus-visible:ring-primary/40 group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      )}
    >
      <span className='text-muted-foreground w-8 shrink-0 text-left text-[11px] tabular-nums'>
        {formatDuration(group.start)}
      </span>
      <span className='flex h-5 w-5 shrink-0 items-center justify-center'>{group.icon}</span>
      <div className='min-w-0 flex-1 text-left'>
        <div className='flex items-center gap-2'>
          <span className='truncate text-xs font-medium'>{group.label}</span>
          {group.count > 1 && (
            <span className='text-muted-foreground text-[11px] whitespace-nowrap'>(×{group.count})</span>
          )}
        </div>
        {group.end > group.start && (
          <div className='text-muted-foreground mt-0.5 text-[11px]'>
            {formatDurationPrecise(group.end - group.start)}
          </div>
        )}
      </div>
    </button>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDurationPrecise(ms: number): string {
  if (ms < 1000) {
    return `${(ms / 1000).toFixed(4)} s`;
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
