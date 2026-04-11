'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type QueryLike<T> = {
  isPending: boolean;
  isFetching: boolean;
  data: T | undefined;
};

const QuerySectionContext = createContext<{ loading: boolean } | null>(null);

type RenderPropsMode<T> = {
  query: QueryLike<T>;
  fallback: ReactNode;
  children: (data: T) => ReactNode;
  loading?: never;
  distributed?: boolean;
  className?: string;
};

type LoadingWrapperMode = {
  loading: boolean;
  children: ReactNode;
  query?: never;
  fallback?: never;
  distributed?: boolean;
  className?: string;
};

type QuerySectionProps<T> = RenderPropsMode<T> | LoadingWrapperMode;

export function QuerySection<T>(props: QuerySectionProps<T>) {
  if (props.query) {
    const { query, fallback, children, className, distributed } = props;
    if (query.isPending || query.data === undefined) return fallback;

    if (distributed) {
      return (
        <QuerySectionContext.Provider value={{ loading: query.isFetching }}>
          {children(query.data)}
        </QuerySectionContext.Provider>
      );
    }

    return (
      <LoadingWrapper loading={query.isFetching} className={className}>
        {children(query.data)}
      </LoadingWrapper>
    );
  }

  const { loading, children, className, distributed } = props as LoadingWrapperMode;

  if (distributed) {
    return <QuerySectionContext.Provider value={{ loading }}>{children}</QuerySectionContext.Provider>;
  }

  return (
    <LoadingWrapper loading={loading} className={className}>
      {children}
    </LoadingWrapper>
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
