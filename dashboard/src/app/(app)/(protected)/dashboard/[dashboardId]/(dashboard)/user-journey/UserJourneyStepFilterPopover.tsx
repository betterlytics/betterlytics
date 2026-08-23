'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { QueryFiltersOverlay } from '@/components/filters/QueryFiltersOverlay';
import { QueryFilterColumnsVisibilityProvider } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { baEvent } from '@/lib/ba-event';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getStepExcludedColumns } from '@/entities/analytics/stepFilters.entities';

const EMPTY_FILTERS: QueryFilter[] = [];

type UserJourneyStepFilterPopoverProps = {
  slot: number;
  lastSlot: number;
  align: 'start' | 'center' | 'end';
  trigger: ReactNode;
};

export function UserJourneyStepFilterPopover({ slot, lastSlot, align, trigger }: UserJourneyStepFilterPopoverProps) {
  const t = useTranslations('components.userJourney');
  const { stepFilters, setStepFilters } = useUserJourneyFilter();
  const committed = stepFilters[slot] ?? EMPTY_FILTERS;

  const apply = useCallback(
    (next: QueryFilter[]) => {
      baEvent('journey-step-filter-applied');
      setStepFilters(slot, next);
    },
    [setStepFilters, slot],
  );

  const excludedColumns = useMemo(() => getStepExcludedColumns(slot, lastSlot), [slot, lastSlot]);

  return (
    <QueryFilterColumnsVisibilityProvider exclude={excludedColumns} mode='hide'>
      <QueryFiltersOverlay
        committedFilters={committed}
        onApply={apply}
        trigger={trigger}
        title={t('stepFilterDialogTitle', { number: slot + 1 })}
        align={align}
        showSavedFilters={false}
      />
    </QueryFilterColumnsVisibilityProvider>
  );
}
