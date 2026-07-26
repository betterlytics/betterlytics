'use client';

import { useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useQueryState } from '@/hooks/use-query-state';
import { usePropertySourceStatus } from '@/hooks/use-is-filter-column-allowed';
import { type PropertyKeysBySource } from '@/entities/analytics/propertySources';

export function usePropertyKeys(): PropertyKeysBySource {
  const { input, options } = useBAQueryParams();
  const getSourceStatus = usePropertySourceStatus();

  const gpEnabled = !getSourceStatus('gp').disabled;
  const cepEnabled = !getSourceStatus('cep').disabled;

  const gpQuery = trpc.filters.getPropertyKeys.useQuery({ ...input, source: 'gp' }, { ...options, enabled: gpEnabled });
  const cepQuery = trpc.filters.getPropertyKeys.useQuery(
    { ...input, source: 'cep' },
    { ...options, enabled: cepEnabled },
  );

  const gp = useQueryState(gpQuery, gpEnabled);
  const cep = useQueryState(cepQuery, cepEnabled);

  return useMemo(
    () => ({
      gp: !gpEnabled || gp.loading ? undefined : (gp.data ?? []),
      cep: !cepEnabled || cep.loading ? undefined : (cep.data ?? []),
    }),
    [gpEnabled, cepEnabled, gp.loading, gp.data, cep.loading, cep.data],
  );
}
