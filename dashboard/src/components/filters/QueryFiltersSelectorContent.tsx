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
import { generateTempId } from '@/utils/temporaryId';
import { SaveQueryFilterDialog } from './SaveQueryFilterDialog';
import { SavedFiltersSection } from './SavedFiltersSection';
import { useSavedFiltersLimitReached } from '@/hooks/use-saved-filters';
import { PermissionGate } from '../tooltip/PermissionGate';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type QueryFiltersSelectorContentProps = {
  initialFilters: QueryFilter[];
  onApply: (filters: QueryFilter[]) => void;
  onCancel: () => void;
  onLoadSavedFilter?: (filters: QueryFilter[]) => void;
  globalPropertyKeys?: string[];
};

export function QueryFiltersSelectorContent({
  initialFilters,
  onApply,
  onCancel,
  onLoadSavedFilter,
  globalPropertyKeys,
}: QueryFiltersSelectorContentProps) {
  const t = useTranslations('components.filters');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false);

  const {
    queryFilters,
    setQueryFilters: setLocalQueryFilters,
    addQueryFilter,
    addEmptyQueryFilter,
    removeQueryFilter,
    updateQueryFilter,
  } = useQueryFilters(initialFilters);

  const draftFilter = useMemo<QueryFilter>(
    () => ({ id: generateTempId(), column: 'url', operator: '=', values: [] }),
    [],
  );

  useEffect(() => {
    setLocalQueryFilters(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialFilters)]);

  const applyFilters = useCallback(() => {
    onApply(filterEmptyQueryFilters(queryFilters));
  }, [queryFilters, onApply]);

  const cancelFilters = useCallback(() => {
    setLocalQueryFilters(initialFilters);
    onCancel();
  }, [initialFilters, setLocalQueryFilters, onCancel]);

  const handleLoadSavedFilter = useCallback(
    (filters: QueryFilter[]) => {
      (onLoadSavedFilter ?? onApply)(filters);
    },
    [onApply, onLoadSavedFilter],
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
        <div
          className={cn(
            'grid grid-rows-[minmax(3rem,1fr)_auto_auto_auto] gap-2 overflow-hidden',
            'p-1 max-h-[calc(var(--radix-popover-content-available-height,85vh)_-_1.5rem)]'
          )}
          style={{ '--query-filters-popover-min-h': '11rem' } as React.CSSProperties}
        >
          <ScrollArea
            className='h-full min-h-0'
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className='space-y-1 pr-2'>
              {queryFilters.map((filter) => (
                <QueryFilterInputRow
                  key={filter.id}
                  onFilterUpdate={updateQueryFilter}
                  filter={filter}
                  requestRemoval={(_filter) => removeQueryFilter(_filter.id)}
                  globalPropertyKeys={globalPropertyKeys}
                />
              ))}
              {queryFilters.length === 0 && (
                <div className='text-muted-foreground flex h-9 items-center justify-center gap-2 text-sm'>
                  {t('selector.emptyNoneSelected')}
                </div>
              )}
            </div>
          </ScrollArea>
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
                onClick={cancelFilters}
                variant='ghost'
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
          <SavedFiltersSection
            onLoadFilter={handleLoadSavedFilter}
            isOpen={isSavedFiltersOpen}
            onOpenChange={setIsSavedFiltersOpen}
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col gap-2 overflow-hidden',
            'max-h-[calc(var(--radix-popover-content-available-height,85vh)_-_1.5rem)]'
          )}
          style={{ '--query-filters-popover-min-h': '11rem' } as React.CSSProperties}
        >
          <div className='space-y-1'>
            <QueryFilterInputRow
              key={draftFilter.id}
              onFilterUpdate={addQueryFilter}
              filter={draftFilter}
              requestRemoval={() => {}}
              disableDeletion
              globalPropertyKeys={globalPropertyKeys}
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
                    addQueryFilter(draftFilter);
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
          <SavedFiltersSection
            onLoadFilter={handleLoadSavedFilter}
            isOpen={isSavedFiltersOpen}
            onOpenChange={setIsSavedFiltersOpen}
          />
        </div>
      )}

      <SaveQueryFilterDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} filters={queryFilters} />
    </>
  );
}
