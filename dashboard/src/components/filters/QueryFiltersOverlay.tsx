'use client';

import { ComponentProps, useCallback, useEffect, useRef, useState, type AnimationEvent, type ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useIsMobile } from '@/hooks/use-mobile';
import { type QueryFilter, type TableFilterColumn } from '@/entities/analytics/filter.entities';
import { generateTempId } from '@/utils/temporaryId';
import { usePropertyKeys } from '@/hooks/use-property-keys';
import { useDefaultFilterColumn } from '@/hooks/use-is-filter-column-allowed';
import { QueryFiltersSelectorContent } from '@/components/filters/QueryFiltersSelectorContent';

const initOrDefault = (filters: QueryFilter[], defaultColumn: TableFilterColumn): QueryFilter[] =>
  filters.length > 0
    ? filters
    : [{ id: generateTempId(), column: defaultColumn, operator: '=', values: [] }];

type QueryFiltersOverlayProps = {
  committedFilters: QueryFilter[];
  onApply: (filters: QueryFilter[]) => void;
  trigger: ReactNode;
  title: ReactNode;
  align?: ComponentProps<typeof PopoverContent>['align'];
  onLoadSavedFilter?: (filters: QueryFilter[]) => void;
  showSavedFilters?: boolean;
};

export function QueryFiltersOverlay({
  committedFilters,
  onApply,
  trigger,
  title,
  align = 'start',
  onLoadSavedFilter,
  showSavedFilters = true,
}: QueryFiltersOverlayProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false);
  const isMobile = useIsMobile();
  const propertyKeys = usePropertyKeys({ enabled: isPopoverOpen });
  const defaultColumn = useDefaultFilterColumn();

  const filters = useQueryFilters(initOrDefault(committedFilters, defaultColumn));

  useEffect(() => {
    filters.setQueryFilters(initOrDefault(committedFilters, defaultColumn));
  }, [committedFilters, defaultColumn]);

  const applyFilters = useCallback(
    (next: QueryFilter[]) => {
      onApply(next);
      setIsPopoverOpen(false);
    },
    [onApply],
  );

  const pendingCancelReset = useRef(false);

  const cancelFilters = useCallback(() => {
    pendingCancelReset.current = true;
    setIsPopoverOpen(false);
  }, []);

  const handleContentAnimationEnd = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (!pendingCancelReset.current) return;
      if (e.currentTarget.dataset.state !== 'closed') return;
      pendingCancelReset.current = false;
      filters.setQueryFilters(initOrDefault(committedFilters, defaultColumn));
    },
    [filters, committedFilters, defaultColumn],
  );

  const handleLoadSavedFilter = useCallback(
    (next: QueryFilter[]) => {
      onLoadSavedFilter?.(next);
      setIsPopoverOpen(false);
    },
    [onLoadSavedFilter],
  );

  const content = (
    <QueryFiltersSelectorContent
      initialFilters={committedFilters}
      filters={filters}
      isSavedFiltersOpen={isSavedFiltersOpen}
      setIsSavedFiltersOpen={setIsSavedFiltersOpen}
      onApply={applyFilters}
      onCancel={cancelFilters}
      onLoadSavedFilter={onLoadSavedFilter ? handleLoadSavedFilter : undefined}
      propertyKeys={propertyKeys}
      showSavedFilters={showSavedFilters}
    />
  );

  if (isMobile) {
    return (
      <Dialog open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[640px] overflow-y-auto px-2 py-3'
          onAnimationEnd={handleContentAnimationEnd}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className='w-[620px] max-w-[calc(100svw-48px)] border p-2 shadow-2xl'
        align={align}
        onAnimationEnd={handleContentAnimationEnd}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
