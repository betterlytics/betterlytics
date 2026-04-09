'use client';

import type { ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type QueryLike<T> = {
  isPending: boolean;
  isFetching: boolean;
  data: T | undefined;
};

type RenderPropsMode<T> = {
  query: QueryLike<T>;
  fallback: ReactNode;
  children: (data: T) => ReactNode;
  loading?: never;
  className?: string;
};

type LoadingWrapperMode = {
  loading: boolean;
  children: ReactNode;
  query?: never;
  fallback?: never;
  className?: string;
};

type QuerySectionProps<T> = RenderPropsMode<T> | LoadingWrapperMode;

export function QuerySection<T>(props: QuerySectionProps<T>) {
  if (props.query) {
    const { query, fallback, children, className } = props;
    if (query.isPending) return fallback;
    return (
      <LoadingWrapper loading={query.isFetching} className={className}>
        {children(query.data as T)}
      </LoadingWrapper>
    );
  }

  const { loading, children, className } = props as LoadingWrapperMode;
  return (
    <LoadingWrapper loading={loading} className={className}>
      {children}
    </LoadingWrapper>
  );
}

function LoadingWrapper({ loading, children, className }: { loading: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div className='absolute inset-0 z-10 flex items-center justify-center'>
          <Spinner />
        </div>
      )}
      <div className={cn(loading && 'pointer-events-none opacity-60')}>
        {children}
      </div>
    </div>
  );
}
