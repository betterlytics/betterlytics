'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QueryFiltersSelectorContent } from '@/components/filters/QueryFiltersSelectorContent';
import { QueryFilterColumnsVisibilityProvider } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePropertyKeys } from '@/hooks/use-property-keys';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';
import { createEmptyQueryFilter, type QueryFilter } from '@/entities/analytics/filter.entities';
import { getStepExcludedColumns } from '@/entities/analytics/stepFilters.entities';

const initOrDefault = (filters: QueryFilter[]): QueryFilter[] =>
  filters.length > 0 ? filters : [createEmptyQueryFilter()];

type UserJourneyStepFilterPopoverProps = {
  slot: number;
  lastSlot: number;
  align: 'start' | 'center' | 'end';
  trigger: ReactNode;
};

export function UserJourneyStepFilterPopover({ slot, lastSlot, align, trigger }: UserJourneyStepFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useTranslations('components.userJourney');
  const propertyKeys = usePropertyKeys();

  const { stepFilters, setStepFilters } = useUserJourneyFilter();
  const committed = useMemo(() => stepFilters[slot] ?? [], [stepFilters, slot]);
  const filters = useQueryFilters(initOrDefault(committed));

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) filters.setQueryFilters(initOrDefault(committed));
      setOpen(next);
    },
    [filters, committed],
  );

  const apply = useCallback(
    (next: QueryFilter[]) => {
      setStepFilters(slot, filterEmptyQueryFilters(next));
      setOpen(false);
    },
    [setStepFilters, slot],
  );

  const cancel = useCallback(() => setOpen(false), []);

  const excludedColumns = useMemo(() => getStepExcludedColumns(slot, lastSlot), [slot, lastSlot]);

  const body = (
    <QueryFilterColumnsVisibilityProvider exclude={excludedColumns} mode='hide'>
      <QueryFiltersSelectorContent
        initialFilters={committed}
        filters={filters}
        isSavedFiltersOpen={isSavedFiltersOpen}
        setIsSavedFiltersOpen={setIsSavedFiltersOpen}
        onApply={apply}
        onCancel={cancel}
        propertyKeys={propertyKeys}
      />
    </QueryFilterColumnsVisibilityProvider>
  );

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[640px] overflow-y-auto px-2 py-3'
        >
          <DialogHeader>
            <DialogTitle>{t('stepFilterDialogTitle', { number: slot + 1 })}</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className='w-[620px] max-w-[calc(100svw-48px)] border p-2 shadow-2xl' align={align}>
        {body}
      </PopoverContent>
    </Popover>
  );
}
