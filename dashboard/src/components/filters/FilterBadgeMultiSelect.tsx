'use client';

import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { type ReactNode, useCallback, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BAMultiSelect } from '@/components/ui/ba-multi-select';
import { formatQueryFilter } from '@/utils/queryFilterFormatters';
import { generateTempId } from '@/utils/temporaryId';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';

type PopoverState =
  | { type: 'closed' }
  | { type: 'edit'; filterId: string }
  | { type: 'new' }
  | { type: 'full' };

type FilterBadgeMultiSelectProps = {
  filters: QueryFilter[];
  onFilterAdd: (filter: QueryFilter) => void;
  onFilterUpdate: (filter: QueryFilter) => void;
  onFilterRemove: (filterId: string) => void;
  className?: string;
  showError?: boolean;
};

function createEmptyFilter(): QueryFilter {
  return { id: generateTempId(), column: 'url', operator: '=', values: [] };
}

export function FilterBadgeMultiSelect({
  filters,
  onFilterAdd,
  onFilterUpdate,
  onFilterRemove,
  className,
  showError,
}: FilterBadgeMultiSelectProps) {
  const t = useTranslations('components.filters');
  const locale = useLocale();

  const [popoverState, setPopoverState] = useState<PopoverState>({ type: 'closed' });
  const [newFilter, setNewFilter] = useState<QueryFilter>(() => createEmptyFilter());

  const editingFilter =
    popoverState.type === 'edit'
      ? filters.find((f) => f.id === popoverState.filterId) ?? null
      : null;

  const closePopover = useCallback(() => setPopoverState({ type: 'closed' }), []);

  const handleBadgeClick = useCallback((_filter: QueryFilter) => {
    setPopoverState({ type: 'edit', filterId: _filter.id });
  }, []);

  const handleEmptyAreaClick = useCallback(() => {
    setNewFilter(createEmptyFilter());
    setPopoverState({ type: 'new' });
  }, []);

  const handleBackspace = useCallback(() => {
    const lastFilter = filters[filters.length - 1];
    if (lastFilter) {
      onFilterRemove(lastFilter.id);
    }
  }, [filters, onFilterRemove]);

  const handleNewFilterChange = useCallback(
    (filter: QueryFilter) => {
      setNewFilter(filter);
      if (filter.values.length > 0) {
        onFilterAdd(filter);
        setPopoverState({ type: 'closed' });
        setNewFilter(createEmptyFilter());
      }
    },
    [onFilterAdd],
  );

  const renderBadge = useCallback(
    (filter: QueryFilter): ReactNode => formatQueryFilter(filter, t, locale),
    [t, locale],
  );

  const iconSlot = (
    <button
      type='button'
      className='text-muted-foreground/80 hover:text-foreground flex size-9 cursor-pointer items-center justify-center transition-colors'
      onClick={(e) => {
        e.stopPropagation();
        setPopoverState((prev) => (prev.type === 'full' ? { type: 'closed' } : { type: 'full' }));
      }}
    >
      <FilterIcon className='size-4' />
    </button>
  );

  return (
    <Popover open={popoverState.type !== 'closed'} onOpenChange={(open) => { if (!open) closePopover(); }}>
      <PopoverAnchor asChild>
        <div>
          <BAMultiSelect
            items={filters}
            getItemId={(f) => f.id}
            renderBadge={renderBadge}
            onBadgeClick={handleBadgeClick}
            onBadgeRemove={(f) => onFilterRemove(f.id)}
            onEmptyAreaClick={handleEmptyAreaClick}
            onBackspace={handleBackspace}
            placeholder={t('selector.addFilter')}
            iconSlot={iconSlot}
            className={cn(showError && 'border-destructive', className)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className='w-auto min-w-[500px] p-2'
        side='bottom'
        align='start'
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {popoverState.type === 'edit' && editingFilter && (
          <QueryFilterInputRow
            filter={editingFilter}
            onFilterUpdate={onFilterUpdate}
            requestRemoval={() => {
              onFilterRemove(editingFilter.id);
              closePopover();
            }}
          />
        )}

        {popoverState.type === 'new' && (
          <QueryFilterInputRow
            filter={newFilter}
            onFilterUpdate={handleNewFilterChange}
            requestRemoval={closePopover}
          />
        )}

        {popoverState.type === 'full' && (
          <div className='space-y-2'>
            {filters.map((filter) => (
              <QueryFilterInputRow
                key={filter.id}
                filter={filter}
                onFilterUpdate={onFilterUpdate}
                requestRemoval={() => onFilterRemove(filter.id)}
              />
            ))}
            <Button
              variant='ghost'
              size='sm'
              className='cursor-pointer'
              onClick={() => onFilterAdd(createEmptyFilter())}
            >
              {t('selector.addFilter')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
