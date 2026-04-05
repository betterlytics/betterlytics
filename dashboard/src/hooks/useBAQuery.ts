'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useBAQueryOptions, type UseBAQueryOptionsInput } from '@/hooks/useBAQueryOptions';

type UseBAQueryInput<T> = UseBAQueryOptionsInput<T> & {
  enabled?: boolean;
};

export function useBAQuery<T>({ enabled, ...input }: UseBAQueryInput<T>) {
  const options = useBAQueryOptions(input);
  return useQuery({
    ...options,
    enabled,
    placeholderData: keepPreviousData,
  });
}
