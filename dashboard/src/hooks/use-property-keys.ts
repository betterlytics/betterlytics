'use client';

import { useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useQueryState } from '@/hooks/use-query-state';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { type PropertyKeysBySource } from '@/entities/analytics/propertySources';

export function usePropertyKeys(): PropertyKeysBySource {
  const { input, options } = useBAQueryParams();
  const { isDemo } = useDashboardAuth();

  const gpQuery = trpc.filters.getPropertyKeys.useQuery({ ...input, source: 'gp' }, { ...options, enabled: !isDemo });
  const cepQuery = trpc.filters.getPropertyKeys.useQuery({ ...input, source: 'cep' }, { ...options, enabled: !isDemo });

  const gp = useQueryState(gpQuery, !isDemo);
  const cep = useQueryState(cepQuery, !isDemo);

  return useMemo(
    () => ({
      gp: isDemo || gp.loading ? undefined : (gp.data ?? []),
      cep: isDemo || cep.loading ? undefined : (cep.data ?? []),
    }),
    [isDemo, gp.loading, gp.data, cep.loading, cep.data],
  );
}
