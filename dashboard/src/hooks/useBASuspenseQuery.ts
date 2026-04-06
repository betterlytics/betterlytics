'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useBAQueryOptions, type UseBAQueryOptionsInput } from '@/hooks/useBAQueryOptions';

export function useBASuspenseQuery<T>(input: UseBAQueryOptionsInput<T>) {
  const options = useBAQueryOptions(input);
  return useSuspenseQuery(options);
}
