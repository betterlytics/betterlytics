'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useQueryState } from '@/hooks/use-query-state';

export type QueryLike<T> = {
  isPending: boolean;
  isFetching: boolean;
  isPlaceholderData?: boolean;
  data: T | undefined;
};

const QuerySectionContext = createContext<{ loading: boolean } | null>(null);

type QuerySectionProps<T> = {
  query: QueryLike<T>;
  fallback: ReactNode;
  children: (data: T) => ReactNode;
  loadContext?: boolean;
  className?: string;
};

export function QuerySection<T>(props: QuerySectionProps<T>) {
  const { query, fallback, loadContext, children, className } = props;
  const hasData = !query.isPending && query.data !== undefined;
  const { refetching } = useQueryState(query);

  const content = hasData ? (
    <LoadingWrapper loading={!loadContext && refetching} className={className}>
      {children(query.data!)}
    </LoadingWrapper>
  ) : null;

  return (
    <div className={cn('grid [&>*]:[grid-area:1/1]', className)}>
      <QuerySectionContext.Provider value={{ loading: Boolean(loadContext && refetching) }}>
        {content}
      </QuerySectionContext.Provider>
      <div className={cn('transition-opacity duration-200', hasData && 'pointer-events-none opacity-0')}>
        {fallback}
      </div>
    </div>
  );
}

function Item({ children, className }: { children: ReactNode; className?: string }) {
  const ctx = useContext(QuerySectionContext);
  const loading = ctx?.loading ?? false;
  return (
    <LoadingWrapper loading={loading} className={className}>
      {children}
    </LoadingWrapper>
  );
}

QuerySection.Item = Item;

function LoadingWrapper({
  loading,
  children,
  className,
}: {
  loading: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div className='absolute inset-0 z-10 flex items-center justify-center'>
          <Spinner />
        </div>
      )}
      <div className={cn('h-full', loading && 'pointer-events-none opacity-60')}>{children}</div>
    </div>
  );
}
