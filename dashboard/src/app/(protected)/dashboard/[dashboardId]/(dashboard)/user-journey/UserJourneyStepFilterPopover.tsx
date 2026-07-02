'use client';

import { useCallback, useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { QueryFiltersSelectorContent } from '@/components/filters/QueryFiltersSelectorContent';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { createEmptyQueryFilter, type QueryFilter } from '@/entities/analytics/filter.entities';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useBAQueryParams } from '@/trpc/hooks';
import { useQueryState } from '@/hooks/use-query-state';
import { trpc } from '@/trpc/client';

const initOrDefault = (filters: QueryFilter[]): QueryFilter[] =>
  filters.length > 0 ? filters : [createEmptyQueryFilter()];

type UserJourneyStepFilterPopoverProps = {
  position: number;
  trigger: ReactNode;
  triggerSummary?: ReactNode;
  align?: ComponentProps<typeof PopoverContent>['align'];
};

export function UserJourneyStepFilterPopover({
  position,
  trigger,
  triggerSummary,
  align = 'start',
}: UserJourneyStepFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useTranslations('components.userJourney');

  const { stepFilters, setStepFilters } = useUserJourneyFilter();
  const committed = stepFilters[position] ?? [];
  const filters = useQueryFilters(initOrDefault(committed));
  const { setQueryFilters } = filters;

  const { input, options } = useBAQueryParams();
  const { isDemo } = useDashboardAuth();
  const gpQuery = trpc.filters.getGlobalPropertyKeys.useQuery(input, { ...options, enabled: !isDemo });
  const { data, loading } = useQueryState(gpQuery, !isDemo);
  const globalPropertyKeys = isDemo || loading ? undefined : (data ?? []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) setQueryFilters(initOrDefault(stepFilters[position] ?? []));
      setIsOpen(open);
    },
    [setQueryFilters, stepFilters, position],
  );

  const applyFilters = useCallback(
    (next: QueryFilter[]) => {
      setStepFilters(position, next);
      setIsOpen(false);
    },
    [setStepFilters, position],
  );

  const cancelFilters = useCallback(() => setIsOpen(false), []);

  const content = (
    <>
      <p className='text-muted-foreground px-1 pt-1 text-xs'>{t('stepFilterHint')}</p>
      <QueryFiltersSelectorContent
        initialFilters={committed}
        filters={filters}
        isSavedFiltersOpen={false}
        setIsSavedFiltersOpen={() => {}}
        onApply={applyFilters}
        onCancel={cancelFilters}
        globalPropertyKeys={globalPropertyKeys}
        hideSavedFilters
        useExtendedRange
      />
    </>
  );

  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[640px] overflow-y-auto px-2 py-3'
        >
          <DialogHeader>
            <DialogTitle>{t('stepFilterDialogTitle', { step: position + 1 })}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        </TooltipTrigger>
        {triggerSummary && !isOpen && <TooltipContent className='max-w-xs'>{triggerSummary}</TooltipContent>}
      </Tooltip>
      <PopoverContent className='w-[620px] max-w-[calc(100svw-48px)] border p-2 shadow-2xl' align={align}>
        {content}
      </PopoverContent>
    </Popover>
  );
}
