'use client';

import { Dispatch, useCallback, useMemo, useState } from 'react';
import { SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Separator } from '@/components/ui/separator';
import { filterEmptyQueryFilters, isQueryFiltersEqual } from '@/utils/queryFilters';
import { useTranslations } from 'next-intl';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { SaveQueryFilterDialog } from '@/components/filters/SaveQueryFilterDialog';
import { SavedFiltersSection } from '@/components/filters/SavedFiltersSection';
import { useSavedFiltersLimitReached } from '@/hooks/use-saved-filters';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type QueryFiltersSelectorContentProps = {
  initialFilters: QueryFilter[];
  filters: ReturnType<typeof useQueryFilters>;
  isSavedFiltersOpen: boolean;
  setIsSavedFiltersOpen: Dispatch<boolean>;
  onApply: (filters: QueryFilter[]) => void;
  onCancel: () => void;
  onLoadSavedFilter?: (filters: QueryFilter[]) => void;
  globalPropertyKeys?: string[];
};

export function QueryFiltersSelectorContent({
  initialFilters,
  filters,
  isSavedFiltersOpen,
  setIsSavedFiltersOpen,
  onApply,
  onCancel,
  onLoadSavedFilter,
  globalPropertyKeys,
}: QueryFiltersSelectorContentProps) {
  const t = useTranslations('components.filters');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const {
    queryFilters,
    setQueryFilters,
    addEmptyQueryFilter,
    removeQueryFilter,
    updateQueryFilter,
  } = filters;

  const applyFilters = useCallback(() => {
    onApply(filterEmptyQueryFilters(queryFilters));
  }, [queryFilters, onApply]);

  const cancelFilters = useCallback(() => {
    setQueryFilters(initialFilters);
    onCancel();
  }, [initialFilters, setQueryFilters, onCancel]);

  const handleLoadSavedFilter = useCallback(
    (filters: QueryFilter[]) => {
      (onLoadSavedFilter ?? onApply)(filters);
    },
    [onApply, onLoadSavedFilter],
  );

  const requestFilterRemoval = useCallback(
    (id: QueryFilter['id']) => {
      if (queryFilters.length <= 1) {
        updateQueryFilter({ id, column: 'url', operator: '=', values: [] });
      } else {
        removeQueryFilter(id);
      }
    },
    [queryFilters.length, updateQueryFilter, removeQueryFilter],
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

  const hasValidFilters = filterEmptyQueryFilters(queryFilters).length > 0;
  const canApply = isFiltersModified;

  const { data: isSavedFiltersLimitReached } = useSavedFiltersLimitReached();

  const ActionsRow = (
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
          onClick={cancelFilters}
          variant='ghost'
        >
          {t('selector.cancel')}
        </Button>
        <Button
          className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
          disabled={!canApply}
          onClick={applyFilters}
          variant={canApply ? 'default' : 'ghost'}
        >
          {t('selector.apply')}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-1 grid-rows-[minmax(3rem,1fr)_auto_auto] gap-2 overflow-hidden p-1',
          'max-h-[calc(85vh_-_4rem)]',
          'md:max-h-[calc(var(--radix-popover-content-available-height,85vh)_-_1.5rem)]',
          '[&_[data-slot=scroll-area-scrollbar]]:!w-2',
        )}
        style={{ '--query-filters-popover-min-h': '11rem' } as React.CSSProperties}
      >
        <ScrollArea
          className='h-full min-h-0'
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className='space-y-1'>
            {queryFilters.map((filter) => (
              <QueryFilterInputRow
                key={filter.id}
                onFilterUpdate={updateQueryFilter}
                filter={filter}
                requestRemoval={requestFilterRemoval}
                globalPropertyKeys={globalPropertyKeys}
              />
            ))}
          </div>
        </ScrollArea>
        <Separator />
        {ActionsRow}
        <SavedFiltersSection
          onLoadFilter={handleLoadSavedFilter}
          isOpen={isSavedFiltersOpen}
          onOpenChange={setIsSavedFiltersOpen}
        />
      </div>

      <SaveQueryFilterDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} filters={queryFilters} />
    </>
  );
}
