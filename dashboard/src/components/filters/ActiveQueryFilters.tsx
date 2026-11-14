'use client';
import { useRef, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { PlusIcon } from 'lucide-react';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useQueryFiltersEditor } from '@/contexts/QueryFiltersEditorProvider';
import { MAX_FILTER_ROWS } from '@/entities/analytics/filter.entities';
import { FilterBand } from '@/components/filters/FilterBand';
import { FilterBandButton } from '@/components/filters/FilterBandButton';
import { FilterPill } from '@/components/filters/FilterPill';
import { useNotifyFiltersUpdated } from '@/components/filters/filtersUpdatedToast';

type ActiveQueryFiltersProps = {
  // 'band' is the pinned one-row version under the topbar
  variant?: 'row' | 'band';
};

export function ActiveQueryFilters({ variant = 'row' }: ActiveQueryFiltersProps) {
  const { queryFilters, removeQueryFilter, setQueryFilters } = useQueryFiltersContext();
  const t = useTranslations('components.filters');
  const notifyFiltersUpdated = useNotifyFiltersUpdated();
  const { openEditor } = useQueryFiltersEditor();
  const { isDemo } = useDashboardAuth();
  const band = variant === 'band';

  // Pills present on first render (e.g. from the URL) must not replay the entrance pulse.
  const initialIdsRef = useRef<Set<string> | null>(null);
  const initialIds = (initialIdsRef.current ??= new Set(queryFilters.map((filter) => filter.id)));

  if (queryFilters.length === 0) {
    return null;
  }

  // Keeps focus off <body> once the pills unmount
  const focusFiltersTrigger = (from: HTMLElement) =>
    from
      .closest('[data-slot=dashboard-filters]')
      ?.querySelector<HTMLElement>('[data-query-filters-trigger]')
      ?.focus({ preventScroll: true });

  const clearAll = (event: MouseEvent<HTMLElement>) => {
    focusFiltersTrigger(event.currentTarget);
    setQueryFilters([]);
    notifyFiltersUpdated(queryFilters, []);
  };

  const pills = queryFilters.map((filter) => (
    <FilterPill
      key={filter.id}
      filter={filter}
      variant={variant}
      isNew={!initialIds.has(filter.id)}
      onRemove={(event) => {
        if (queryFilters.length === 1) focusFiltersTrigger(event.currentTarget);
        removeQueryFilter(filter.id);
      }}
    />
  ));

  // Matches the editor's own Add filter button
  const canAddFilter = !isDemo && queryFilters.length < MAX_FILTER_ROWS;

  if (!band) {
    return <div className='flex flex-wrap gap-1 sm:justify-end'>{pills}</div>;
  }

  return (
    <FilterBand
      pills={pills}
      pillsKey={queryFilters}
      label={t('activeFilters')}
      onClearAll={clearAll}
      action={
        canAddFilter && (
          <FilterBandButton
            data-band-add=''
            icon={<PlusIcon />}
            tooltip={t('selector.addFilter')}
            onClick={() => openEditor({ newFilter: true })}
          />
        )
      }
    />
  );
}
