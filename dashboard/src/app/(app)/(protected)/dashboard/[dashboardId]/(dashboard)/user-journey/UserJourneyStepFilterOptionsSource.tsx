'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/trpc/client';
import {
  FilterOptionsSourceProvider,
  type FilterOptionsSource,
} from '@/components/filters/FilterOptionsSourceProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useAllowedStepFilters, usePropertySourceStatus } from '@/hooks/use-is-filter-column-allowed';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useBAQueryParams } from '@/trpc/hooks';
import { useQueryState } from '@/hooks/use-query-state';
import { isUsableFilter, type QueryFilter, type ScopeFilter } from '@/entities/analytics/filter.entities';
import { classifyStepFilter } from '@/entities/analytics/stepFilters.entities';

const EMPTY_OPTIONS: string[] = [];

const StepScopeContext = createContext<number | undefined>(undefined);

const useStepScope = (): number => {
  const slot = useContext(StepScopeContext);
  if (slot === undefined) {
    throw new Error('useStepScope must be used within UserJourneyStepFilterOptionsProvider');
  }
  return slot;
};

const scopes = (filter: QueryFilter, slot: number, lastSlot: number): boolean =>
  isUsableFilter(filter) &&
  filter.values.length > 0 &&
  classifyStepFilter(filter.column, slot, lastSlot) !== 'infeasible';

const toScopeFilter = ({ column, operator, values }: QueryFilter): ScopeFilter => ({ column, operator, values });

const useWireStepFilters = (slot: number): Record<string, ScopeFilter[]> => {
  const { stepFilters, numberOfSteps } = useUserJourneyFilter();
  const allowedStepFilters = useAllowedStepFilters(stepFilters, numberOfSteps);
  const lastSlot = numberOfSteps - 1;
  return useMemo(() => {
    const entries: Array<[string, ScopeFilter[]]> = [];
    for (const [stepSlot, slotFilters] of Object.entries(allowedStepFilters)) {
      if (Number(stepSlot) >= slot) continue;
      const scoping = slotFilters
        .filter((committed) => scopes(committed, Number(stepSlot), lastSlot))
        .map(toScopeFilter);
      if (scoping.length > 0) entries.push([stepSlot, scoping]);
    }
    return Object.fromEntries(entries);
  }, [allowedStepFilters, slot, lastSlot]);
};

const useJourneyFilterOptionsQuery: FilterOptionsSource['useFilterOptionsQuery'] = ({
  query,
  column,
  search,
  limit,
  enabled,
}) => {
  const slot = useStepScope();
  const dashboardId = useDashboardId();
  const t = useTranslations('components.userJourney');
  const wireStepFilters = useWireStepFilters(slot);

  const hasScopingFilters = Object.keys(wireStepFilters).length > 0;

  const { data = EMPTY_OPTIONS, isLoading } = trpc.userJourney.stepFilterOptions.useQuery(
    { dashboardId, query, column, search, limit, slot, stepFilters: wireStepFilters },
    { staleTime: 5 * 60 * 1000, gcTime: 5 * 60 * 1000, enabled },
  );

  const scopeKey = useMemo(() => `${slot}:${JSON.stringify(wireStepFilters)}`, [slot, wireStepFilters]);

  const emptyIndicator = (
    <div className='text-muted-foreground flex items-center gap-2 p-2 text-sm'>
      <span>{hasScopingFilters ? t('stepFilterNoMatchingJourneys') : t('stepFilterNoJourneysReach')}</span>
    </div>
  );

  return { options: data, isLoading, emptyIndicator, scopeKey };
};

const useJourneyPropertyKeysQuery: FilterOptionsSource['usePropertyKeysQuery'] = ({ enabled }) => {
  const slot = useStepScope();
  const { input, options } = useBAQueryParams();
  const getSourceStatus = usePropertySourceStatus();
  const cepEnabled = !getSourceStatus('cep').disabled;
  const wireStepFilters = useWireStepFilters(slot);

  const cepQuery = trpc.userJourney.stepPropertyKeys.useQuery(
    { ...input, slot, stepFilters: wireStepFilters },
    { ...options, enabled: cepEnabled && enabled },
  );
  const cep = useQueryState(cepQuery, cepEnabled && enabled);

  return useMemo(
    () => ({
      gp: undefined,
      cep: !cepEnabled || !enabled || cep.loading ? undefined : (cep.data ?? []),
    }),
    [cepEnabled, enabled, cep.loading, cep.data],
  );
};

const JOURNEY_FILTER_OPTIONS_SOURCE: FilterOptionsSource = {
  useFilterOptionsQuery: useJourneyFilterOptionsQuery,
  usePropertyKeysQuery: useJourneyPropertyKeysQuery,
};

export function UserJourneyStepFilterOptionsProvider({ slot, children }: { slot: number; children: ReactNode }) {
  return (
    <StepScopeContext.Provider value={slot}>
      <FilterOptionsSourceProvider source={JOURNEY_FILTER_OPTIONS_SOURCE}>{children}</FilterOptionsSourceProvider>
    </StepScopeContext.Provider>
  );
}
