'use client';

import { useCallback, useRef } from 'react';
import { List, RowComponentProps } from 'react-window';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type ListPanelProps = {
  title: string;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  items?: ListPanelItem[];
  empty?: React.ReactNode;
  onReachEnd?: () => void;
  isFetchingMore?: boolean;
  hasNextPage?: boolean;
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
  onReachEnd,
  isFetchingMore,
  hasNextPage,
}: ListPanelProps) {
  // Guard against duplicate fetches for the same list length
  const triggeredForLengthRef = useRef<number>(0);

  const handleRowsRendered = useCallback(
    (visibleRows: { startIndex: number; stopIndex: number }) => {
      if (!onReachEnd || !hasNextPage || isFetchingMore || !items) return;

      // Reset guard if list got shorter (e.g., when user applies filters)
      if (triggeredForLengthRef.current > items.length) {
        triggeredForLengthRef.current = 0;
      }

      const prefetchFromIndex = Math.max(0, items.length - 3); // prefetch 3 items before the end
      if (visibleRows.stopIndex >= prefetchFromIndex) {
        if (triggeredForLengthRef.current !== items.length) {
          triggeredForLengthRef.current = items.length;
          onReachEnd();
        }
      }
    },
    [items, hasNextPage, isFetchingMore, onReachEnd],
  );

  return (
    <Card className={cn('flex h-full min-h-0 flex-col !gap-0 overflow-hidden !p-0', className)}>
      <CardHeader className='border-border/60 bg-muted/60 flex items-center justify-between gap-3 border-b px-4 py-3 !pb-3'>
        <div className='space-y-1'>
          <CardTitle className='text-sm font-medium tracking-tight'>{title}</CardTitle>
          {subtitle && <CardDescription className='text-xs leading-relaxed'>{subtitle}</CardDescription>}
        </div>
        {headerRight && <div className='shrink-0'>{headerRight}</div>}
      </CardHeader>

      <CardContent className='flex flex-1 flex-col !px-0 !py-0'>
        <div className='flex max-h-[calc(100svh-250px)] flex-1 flex-col px-2 py-2'>
          {items ? (
            items.length === 0 ? (
              empty
            ) : (
              <List
                rowComponent={RenderRow}
                rowCount={items.length + 1} // +1 for footer
                rowHeight={115}
                onRowsRendered={handleRowsRendered}
                rowProps={{ items, isFetchingMore, hasNextPage }}
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

type RenderItemProps = RowComponentProps<{
  items: ListPanelItem[];
  isFetchingMore?: boolean;
  hasNextPage?: boolean;
}>;

function FooterState({ isFetchingMore, hasNextPage }: { isFetchingMore?: boolean; hasNextPage?: boolean }) {
  const t = useTranslations('components.sessionReplay.sessionList');
  if (isFetchingMore) {
    return (
      <div className='text-muted-foreground flex items-center justify-center text-xs'>
        <Spinner size='sm' />
        <span className='ml-2'>{t('loadingMore')}</span>
      </div>
    );
  }
  if (hasNextPage) {
    return <div className='text-muted-foreground text-center text-xs'>{t('scrollToLoadMore')}</div>;
  }
  return <div className='text-muted-foreground/80 text-center text-xs'>{t('endOfList')}</div>;
}

function RenderRow({ items, isFetchingMore, hasNextPage, index, style, ariaAttributes }: RenderItemProps) {
  if (index === items.length) {
    return (
      <div
        style={style as React.CSSProperties}
        className='flex items-center justify-center py-2'
        {...ariaAttributes}
      >
        <FooterState isFetchingMore={isFetchingMore} hasNextPage={hasNextPage} />
      </div>
    );
  }

  const item = items[index];
  return (
    <div style={style as React.CSSProperties} className='pb-2' {...ariaAttributes}>
      {item.content}
    </div>
  );
}
