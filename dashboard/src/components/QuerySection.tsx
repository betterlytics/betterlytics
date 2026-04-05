'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type RenderPropsMode<T> = {
  query: UseQueryResult<T>;
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
  return <div className={cn('relative', loading && 'pointer-events-none animate-pulse', className)}>{children}</div>;
}
