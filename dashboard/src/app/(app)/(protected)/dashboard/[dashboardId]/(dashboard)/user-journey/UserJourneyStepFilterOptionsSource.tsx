'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/trpc/client';
import {
  FilterOptionsSourceProvider,
  type FilterOptionsSource,
} from '@/components/filters/FilterOptionsSourceProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useDashboardId } from '@/hooks/use-dashboard-id';
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

const useJourneyFilterOptionsQuery: FilterOptionsSource['useFilterOptionsQuery'] = ({
  filter,
  siblingFilters,
  query,
  column,
  search,
  limit,
  enabled,
}) => {
  const slot = useStepScope();
  const dashboardId = useDashboardId();
  const t = useTranslations('components.userJourney');
  const { stepFilters, numberOfSteps } = useUserJourneyFilter();
  const lastSlot = numberOfSteps - 1;

  const wireStepFilters = useMemo(() => {
    const entries: Array<[string, ScopeFilter[]]> = [];
    for (const [stepSlot, slotFilters] of Object.entries(stepFilters)) {
      if (Number(stepSlot) >= slot) continue;
      const scoping = slotFilters
        .filter((committed) => scopes(committed, Number(stepSlot), lastSlot))
        .map(toScopeFilter);
      if (scoping.length > 0) entries.push([stepSlot, scoping]);
    }
    const siblings = siblingFilters
      .filter((sibling) => sibling.id !== filter.id && scopes(sibling, slot, lastSlot))
      .map(toScopeFilter);
    if (siblings.length > 0) entries.push([String(slot), siblings]);
    return Object.fromEntries(entries);
  }, [stepFilters, siblingFilters, filter.id, slot, lastSlot]);

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

const JOURNEY_FILTER_OPTIONS_SOURCE: FilterOptionsSource = {
  useFilterOptionsQuery: useJourneyFilterOptionsQuery,
};

export function UserJourneyStepFilterOptionsProvider({ slot, children }: { slot: number; children: ReactNode }) {
  return (
    <StepScopeContext.Provider value={slot}>
      <FilterOptionsSourceProvider source={JOURNEY_FILTER_OPTIONS_SOURCE}>{children}</FilterOptionsSourceProvider>
    </StepScopeContext.Provider>
  );
}
