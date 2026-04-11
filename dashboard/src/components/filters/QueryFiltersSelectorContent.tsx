'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueryFilterInputRow } from './QueryFilterInputRow';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Separator } from '@/components/ui/separator';
import { filterEmptyQueryFilters, isQueryFiltersEqual } from '@/utils/queryFilters';
import { useTranslations } from 'next-intl';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { SaveQueryFilterDialog } from './SaveQueryFilterDialog';
import { SavedFiltersSection } from './SavedFiltersSection';
import { useSavedFiltersLimitReached } from '@/hooks/use-saved-filters';
import { PermissionGate } from '../tooltip/PermissionGate';

type QueryFiltersSelectorContentProps = {
  initialFilters: QueryFilter[];
  onApply: (filters: QueryFilter[]) => void;
  onCancel: () => void;
};

export function QueryFiltersSelectorContent({
  initialFilters,
  onApply,
  onCancel,
}: QueryFiltersSelectorContentProps) {
  const t = useTranslations('components.filters');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false);

  const {
    queryFilters,
    setQueryFilters: setLocalQueryFilters,
    addEmptyQueryFilter,
    removeQueryFilter,
    updateQueryFilter,
  } = useQueryFilters();

  useEffect(() => {
    setLocalQueryFilters(initialFilters);
  }, [initialFilters]);

  const applyFilters = useCallback(() => {
    onApply(filterEmptyQueryFilters(queryFilters));
  }, [queryFilters, onApply]);

  const cancelFilters = useCallback(() => {
    setLocalQueryFilters(initialFilters);
    onCancel();
  }, [initialFilters, setLocalQueryFilters, onCancel]);

  const handleLoadSavedFilter = useCallback(
    (filters: QueryFilter[]) => {
      onApply(filters);
    },
    [onApply],
  );

  const isFiltersModified = useMemo(() => {
    const filteredQueryFilters = filterEmptyQueryFilters(queryFilters);
    const filteredInitialFilters = filterEmptyQueryFilters(initialFilters);
    return (
      filteredQueryFilters.length !== filteredInitialFilters.length ||
      filteredQueryFilters.some((filter, index) => {
        const initFilter = filteredInitialFilters[index];
        return isQueryFiltersEqual(initFilter, filter) === false;
      })
    );
  }, [initialFilters, queryFilters]);

  const hasValidFilters = useMemo(() => {
    return filterEmptyQueryFilters(queryFilters).length > 0;
  }, [queryFilters]);

  const { data: isSavedFiltersLimitReached } = useSavedFiltersLimitReached();

  return (
    <>
      {queryFilters.length > 0 || isFiltersModified ? (
        <div className='space-y-2'>
          <div className='space-y-1'>
            {queryFilters.map((filter) => (
              <QueryFilterInputRow
                key={filter.id}
                onFilterUpdate={updateQueryFilter}
                filter={filter}
                requestRemoval={(_filter) => removeQueryFilter(_filter.id)}
              />
            ))}
            {queryFilters.length === 0 && (
              <div className='text-muted-foreground flex h-9 items-center justify-center gap-2 text-sm'>
                {t('selector.emptyNoneSelected')}
              </div>
            )}
          </div>
          <Separator />
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <PermissionGate allowViewer when={queryFilters.length >= 1}>
              {(isDisabled) => (
                <Button
                  className='h-8 w-full cursor-pointer md:w-28'
                  onClick={() => {
                    if (isDisabled) return;
                    addEmptyQueryFilter();
                  }}
                  variant='outline'
                  disabled={isDisabled}
                >
                  {t('selector.addFilter')}
                </Button>
              )}
            </PermissionGate>
            <div className='flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-2'>
              <PermissionGate>
                {(disabled) => (
                  <DisabledTooltip
                    disabled={Boolean(!disabled && isSavedFiltersLimitReached)}
                    message={t('selector.savedFiltersLimitReached')}
                  >
                    {(isLimitDisabled) => (
                      <Button
                        className='h-8 cursor-pointer'
                        variant='ghost'
                        onClick={() => setIsSaveDialogOpen(true)}
                        disabled={disabled || !hasValidFilters || isLimitDisabled}
                      >
                        <SaveIcon className='h-4 w-4' />
                      </Button>
                    )}
                  </DisabledTooltip>
                )}
              </PermissionGate>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
                disabled={!isFiltersModified}
                onClick={cancelFilters}
                variant={'ghost'}
              >
                {t('selector.cancel')}
              </Button>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
                disabled={isFiltersModified === false}
                onClick={applyFilters}
                variant={isFiltersModified ? 'default' : 'ghost'}
              >
                {t('selector.apply')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-2'>
          <div className='space-y-1'>
            <QueryFilterInputRow
              key={'new'}
              onFilterUpdate={updateQueryFilter}
              filter={addEmptyQueryFilter() as any}
              requestRemoval={(filter) => removeQueryFilter(filter.id)}
            />
          </div>
          <Separator />
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <PermissionGate allowViewer when={queryFilters.length >= 1}>
              {(disabled) => (
                <Button
                  className='h-8 w-full cursor-pointer md:w-28'
                  onClick={() => {
                    if (disabled) return;
                    addEmptyQueryFilter();
                  }}
                  variant='outline'
                  disabled={disabled}
                >
                  {t('selector.addFilter')}
                </Button>
              )}
            </PermissionGate>
            <div className='flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-3'>
              <Button className='h-8 w-[48%] max-w-[110px] cursor-pointer' onClick={cancelFilters} variant='ghost'>
                {t('selector.cancel')}
              </Button>
              <Button className='h-8 w-[48%] max-w-[110px] cursor-pointer' onClick={applyFilters}>
                {t('selector.apply')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <SavedFiltersSection
        onLoadFilter={handleLoadSavedFilter}
        isOpen={isSavedFiltersOpen}
        onOpenChange={setIsSavedFiltersOpen}
      />

      <SaveQueryFilterDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} filters={queryFilters} />
    </>
  );
}
