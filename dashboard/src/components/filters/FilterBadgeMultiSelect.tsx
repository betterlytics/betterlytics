'use client';

import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { type Dispatch, type ReactNode, useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import { FilterIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BAMultiSelect } from '@/components/ba-multi-select';
import { Button } from '@/components/ui/button';
import { formatQueryFilter } from '@/utils/queryFilterFormatters';
import { generateTempId } from '@/utils/temporaryId';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';
import { QueryFiltersSelectorContent } from '@/components/filters/QueryFiltersSelectorContent';

type PopoverState =
  | { type: 'closed' }
  | { type: 'edit'; filterId: string }
  | { type: 'new' }
  | { type: 'full' };

type FilterBadgeMultiSelectProps = {
  filters: QueryFilter[];
  onFilterAdd: Dispatch<QueryFilter>;
  onFilterUpdate: Dispatch<QueryFilter>;
  onFilterRemove: Dispatch<string>;
  onFiltersReplace: Dispatch<QueryFilter[]>;
  globalPropertyKeys?: string[];
  className?: string;
  showError?: boolean;
  useExtendedRange?: boolean;
  formatLength?: number;
};

function createEmptyFilter(): QueryFilter {
  return { id: generateTempId(), column: 'url', operator: '=', values: [] };
}

function isValidFilter(f: QueryFilter): boolean {
  return (
    Boolean(f.column) &&
    Boolean(f.operator) &&
    f.values.length > 0 &&
    f.values.every((v) => Boolean(v))
  );
}

export function FilterBadgeMultiSelect({
  filters,
  onFilterAdd,
  onFilterUpdate,
  onFilterRemove,
  onFiltersReplace,
  globalPropertyKeys,
  className,
  showError,
  useExtendedRange,
  formatLength,
}: FilterBadgeMultiSelectProps) {
  const t = useTranslations('components.filters');
  const locale = useLocale();

  const [popoverState, setPopoverState] = useState<PopoverState>({ type: 'closed' });
  const [newFilter, setNewFilter] = useState<QueryFilter>(() => createEmptyFilter());
  const [editDraft, setEditDraft] = useState<QueryFilter | null>(null);
  const multiSelectRef = useRef<HTMLDivElement>(null);
  const lastOpenStateRef = useRef<PopoverState>({ type: 'closed' });

  if (popoverState.type !== 'closed') {
    lastOpenStateRef.current = popoverState;
  }
  const displayState = popoverState.type !== 'closed' ? popoverState : lastOpenStateRef.current;

  const editingFilter =
    displayState.type === 'edit'
      ? filters.find((f) => f.id === displayState.filterId) ?? null
      : null;

  const closePopover = useCallback(() => flushSync(() => setPopoverState({ type: 'closed' })), []);

  const closeAndFocus = useCallback(() => {
    flushSync(() => setPopoverState({ type: 'closed' }));
    multiSelectRef.current?.focus();
  }, []);

  const handleBadgeClick = useCallback((filter: QueryFilter) => {
    setEditDraft({ ...filter });
    setPopoverState({ type: 'edit', filterId: filter.id });
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

  const handleApplyEdit = useCallback(() => {
    if (!editDraft || !isValidFilter(editDraft)) return;
    onFilterUpdate(editDraft);
    closeAndFocus();
    setEditDraft(null);
  }, [editDraft, onFilterUpdate, closeAndFocus]);

  const handleApplyNew = useCallback(() => {
    if (!isValidFilter(newFilter)) return;
    onFilterAdd(newFilter);
    closeAndFocus();
    setNewFilter(createEmptyFilter());
  }, [newFilter, onFilterAdd, closeAndFocus]);

  const handleFullApply = useCallback(
    (applied: QueryFilter[]) => {
      onFiltersReplace(applied);
      closeAndFocus();
    },
    [onFiltersReplace, closeAndFocus],
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
    <Popover modal open={popoverState.type !== 'closed'} onOpenChange={(open) => { if (!open) closePopover(); }}>
      <PopoverAnchor asChild>
        <div className={className}>
          <BAMultiSelect
            ref={multiSelectRef}
            items={filters}
            getItemId={(f) => f.id}
            renderBadge={renderBadge}
            onBadgeClick={handleBadgeClick}
            onBadgeRemove={(f) => onFilterRemove(f.id)}
            onEmptyAreaClick={handleEmptyAreaClick}
            onBackspace={handleBackspace}
            expanded={popoverState.type !== 'closed'}
            placeholder={t('selector.addFilterPlaceholder')}
            separator={
              <span
                aria-hidden
                className='text-muted-foreground/50 flex items-center font-mono text-xs select-none'
              >
                &
              </span>
            }
            iconSlot={iconSlot}
            className={cn('w-full', showError && 'border-destructive')}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className='w-[var(--radix-popper-anchor-width)] p-2'
        side='bottom'
        align='start'
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {displayState.type === 'edit' && editingFilter && editDraft && (
          <div className='flex flex-col gap-2'>
            <QueryFilterInputRow
              filter={editDraft}
              onFilterUpdate={setEditDraft}
              requestRemoval={() => {
                onFilterRemove(editingFilter.id);
                closePopover();
              }}
              globalPropertyKeys={globalPropertyKeys}
              useExtendedRange={useExtendedRange}
              formatLength={formatLength}
            />
            <div className='flex w-full justify-end gap-2'>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
                onClick={closePopover}
                variant='ghost'
              >
                {t('selector.cancel')}
              </Button>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
                disabled={editDraft.values.length === 0}
                onClick={handleApplyEdit}
                variant={editDraft.values.length > 0 ? 'default' : 'ghost'}
              >
                {t('selector.apply')}
              </Button>
            </div>
          </div>
        )}

        {displayState.type === 'new' && (
          <div className='flex flex-col gap-2'>
            <QueryFilterInputRow
              filter={newFilter}
              onFilterUpdate={setNewFilter}
              requestRemoval={closePopover}
              globalPropertyKeys={globalPropertyKeys}
              useExtendedRange={useExtendedRange}
              formatLength={formatLength}
            />
            <div className='flex w-full justify-end gap-2'>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
                onClick={closePopover}
                variant='ghost'
              >
                {t('selector.cancel')}
              </Button>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
                disabled={newFilter.values.length === 0}
                onClick={handleApplyNew}
                variant={newFilter.values.length > 0 ? 'default' : 'ghost'}
              >
                {t('selector.apply')}
              </Button>
            </div>
          </div>
        )}

        {displayState.type === 'full' && (
          <QueryFiltersSelectorContent
            initialFilters={filters}
            onApply={handleFullApply}
            onCancel={closePopover}
            globalPropertyKeys={globalPropertyKeys}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
