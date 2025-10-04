'use client';

import { List, RowComponentProps } from 'react-window';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDurationPrecise, formatTimestamp } from '@/utils/dateFormatters';

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
  rowHeight?: number;
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
  rowHeight = 40,
}: ListPanelProps) {
  return (
    <Card className={cn('flex h-full min-h-0 flex-col !gap-0 overflow-hidden !p-0', className)}>
      <CardHeader className='border-border/60 bg-muted/60 flex items-center justify-between gap-3 border-b px-4 py-3'>
        <div className='space-y-1'>
          <CardTitle className='text-sm font-medium tracking-tight'>{title}</CardTitle>
          {subtitle ? <CardDescription className='text-xs leading-relaxed'>{subtitle}</CardDescription> : null}
        </div>
        {headerRight ? <div className='shrink-0'>{headerRight}</div> : null}
      </CardHeader>
      <CardContent className='flex flex-1 flex-col !px-0 !py-0'>
        <div className='flex max-h-[calc(100svh-250px)] flex-1 flex-col px-2 py-2'>
          {groups ? (
            groups.length === 0 ? (
              (empty ?? null)
            ) : (
              <List
                className={listClassName}
                rowComponent={RenderGroup}
                rowCount={groups.length}
                rowHeight={rowHeight}
                rowProps={{ groups, onJump }}
              />
            )
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
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
        'hover:bg-primary/10 focus-visible:ring-primary/40 group flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      )}
    >
      <span className='text-muted-foreground w-8 shrink-0 text-left text-[11px] tabular-nums'>
        {formatTimestamp(group.start)}
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
