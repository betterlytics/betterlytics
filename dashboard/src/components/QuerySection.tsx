'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type RenderPropsMode<T> = {
  query: UseQueryResult<T>;
  fallback: ReactNode;
  children: (data: T) => ReactNode;
  loading?: never;
};

type LoadingWrapperMode = {
  loading: boolean;
  children: ReactNode;
  query?: never;
  fallback?: never;
};

type QuerySectionProps<T> = RenderPropsMode<T> | LoadingWrapperMode;

export function QuerySection<T>(props: QuerySectionProps<T>) {
  if (props.query) {
    const { query, fallback, children } = props;
    if (query.isPending) return fallback;
    return <LoadingWrapper loading={query.isFetching}>{children(query.data as T)}</LoadingWrapper>;
  }

  const { loading, children } = props as LoadingWrapperMode;
  return <LoadingWrapper loading={loading}>{children}</LoadingWrapper>;
}

function LoadingWrapper({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <div className={cn('relative transition-opacity duration-200', loading && 'pointer-events-none opacity-80')}>
      {loading && (
        <div className='absolute top-0 right-0 left-0 z-10 h-0.5 overflow-hidden rounded-full'>
          <div className='bg-primary h-full w-full animate-pulse' />
        </div>
      )}
      {children}
    </div>
  );
}
