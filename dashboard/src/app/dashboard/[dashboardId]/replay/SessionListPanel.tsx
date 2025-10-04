'use client';

import { List, RowComponentProps } from 'react-window';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';

type ListPanelProps = {
  title: string;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  items?: ListPanelItem[];
  empty?: React.ReactNode;
  listClassName?: string;
};

export type ListPanelItem = {
  id: string;
  content: React.ReactNode;
};

export function SessionListPanel({
  title,
  subtitle,
  headerRight,
  className,
  children,
  items,
  empty,
  listClassName,
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
      <div className='max-h-[calc(100svh-250px)] flex-1 px-2 py-2'>
        {items ? (
          items.length === 0 ? (
            (empty ?? null)
          ) : (
            <List
              rowComponent={RenderItem}
              rowCount={items.length}
              rowHeight={170}
              rowProps={useMemo(() => ({ items }), [items])}
            />
          )
        ) : (
          children
        )}
      </div>
    </div>
  );
}

type RenderItemProps = RowComponentProps<{
  items: ListPanelItem[];
}>;

function RenderItem({ items, index, style }: RenderItemProps) {
  const item = items[index];
  return (
    <div style={style as React.CSSProperties} className='pb-2'>
      {item.content}
    </div>
  );
}
