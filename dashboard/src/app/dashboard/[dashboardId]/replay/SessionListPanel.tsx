'use client';

import { List, RowComponentProps } from 'react-window';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ListPanelProps = {
  title: string;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  items?: ListPanelItem[];
  empty?: React.ReactNode;
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
          {items ? (
            items.length === 0 ? (
              (empty ?? null)
            ) : (
              <List rowComponent={RenderItem} rowCount={items.length} rowHeight={115} rowProps={{ items }} />
            )
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
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
