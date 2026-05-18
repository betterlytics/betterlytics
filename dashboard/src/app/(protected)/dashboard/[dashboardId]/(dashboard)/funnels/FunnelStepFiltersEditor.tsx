'use client';

import { memo, useCallback, useRef, useState } from 'react';
import { SaveIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';
import { SavedFiltersSection } from '@/components/filters/SavedFiltersSection';
import { SaveQueryFilterDialog } from '@/components/filters/SaveQueryFilterDialog';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { useSavedFiltersLimitReached } from '@/hooks/use-saved-filters';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';
import { createEmptyQueryFilter, type QueryFilter } from '@/entities/analytics/filter.entities';

type FunnelStepFiltersEditorProps = {
  filters: QueryFilter[];
  onChange: (next: QueryFilter[]) => void;
  globalPropertyKeys?: string[];
};

function FunnelStepFiltersEditorComponent({
  filters,
  onChange,
  globalPropertyKeys,
}: FunnelStepFiltersEditorProps) {
  const t = useTranslations('components.filters');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false);

  const { data: isSavedFiltersLimitReached } = useSavedFiltersLimitReached();
  const hasValidFilters = filterEmptyQueryFilters(filters).length > 0;

  const filtersListRef = useRef<HTMLDivElement>(null);

  const handleUpdate = useCallback(
    (next: QueryFilter) => {
      onChange(filters.map((f) => (f.id === next.id ? next : f)));
    },
    [filters, onChange],
  );

  const handleAdd = useCallback(() => {
    onChange([...filters, createEmptyQueryFilter()]);
    requestAnimationFrame(() => {
      filtersListRef.current?.lastElementChild
        ?.querySelector<HTMLElement>('[data-slot="dropdown-menu-trigger"]')
        ?.focus({ focusVisible: true } as FocusOptions);
    });
  }, [filters, onChange]);

  const handleRemove = useCallback(
    (id: QueryFilter['id']) => {
      if (filters.length <= 1) {
        onChange([createEmptyQueryFilter()]);
      } else {
        onChange(filters.filter((f) => f.id !== id));
      }
    },
    [filters, onChange],
  );

  return (
    <div className="py-1">
      <div
        className='grid max-h-[45vh] grid-cols-1 grid-rows-[minmax(3rem,1fr)_auto_auto] gap-2 overflow-hidden p-1'
      >
        <ScrollArea
          className='h-full min-h-0 [&_[data-slot=scroll-area-scrollbar]]:!w-2'
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div ref={filtersListRef} className='space-y-1'>
            {filters.map((filter) => (
              <QueryFilterInputRow
                key={filter.id}
                filter={filter}
                onFilterUpdate={handleUpdate}
                requestRemoval={handleRemove}
                globalPropertyKeys={globalPropertyKeys}
              />
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className='flex items-center justify-between gap-2'>
          <Button
            className='h-8 cursor-pointer md:w-28'
            onClick={handleAdd}
            variant='outline'
          >
            {t('selector.addFilter')}
          </Button>
          <DisabledTooltip
            disabled={Boolean(isSavedFiltersLimitReached)}
            message={t('selector.savedFiltersLimitReached')}
          >
            {(isLimitDisabled) => (
              <Button
                className='h-8 cursor-pointer'
                variant='ghost'
                onClick={() => setIsSaveDialogOpen(true)}
                disabled={!hasValidFilters || isLimitDisabled}
              >
                <SaveIcon className='h-4 w-4' />
              </Button>
            )}
          </DisabledTooltip>
        </div>
        <SavedFiltersSection
          className="[&_[data-slot=saved-filters-collapsible-content]]:grid-rows-[fit-content(20vh)]"
          onLoadFilter={onChange}
          isOpen={isSavedFiltersOpen}
          onOpenChange={setIsSavedFiltersOpen}
        />
      </div>
      <SaveQueryFilterDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        filters={filters}
      />
    </div>
  );
}

export const FunnelStepFiltersEditor = memo(FunnelStepFiltersEditorComponent);
FunnelStepFiltersEditor.displayName = 'FunnelStepFiltersEditor';
