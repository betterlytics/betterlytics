'use client';

import { SaveIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useRef, useState } from 'react';

import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';
import { SavedFiltersSection } from '@/components/filters/SavedFiltersSection';
import { SaveQueryFilterDialog } from '@/components/filters/SaveQueryFilterDialog';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { createEmptyQueryFilter, isNonEmptyValue, type QueryFilter } from '@/entities/analytics/filter.entities';
import { type PropertyKeysBySource } from '@/entities/analytics/propertySources';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSavedFiltersLimitReached } from '@/hooks/use-saved-filters';
import { cn } from '@/lib/utils';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';

type FunnelStepFiltersEditorProps = {
  filters: QueryFilter[];
  onChange: (next: QueryFilter[]) => void;
  propertyKeys?: PropertyKeysBySource;
  showEmptyValueErrors?: boolean;
};

const INTERACTIVE_ELEMENT_SELECTOR =
  'input, textarea, button, select, [role="button"], [role="combobox"], [role="menuitem"], [contenteditable="true"]' as const;

function FunnelStepFiltersEditorComponent({
  filters,
  onChange,
  propertyKeys,
  showEmptyValueErrors,
}: FunnelStepFiltersEditorProps) {
  const t = useTranslations('components.filters');
  const isMobile = useIsMobile();
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

  const preventDragFromInteractiveElements = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(INTERACTIVE_ELEMENT_SELECTOR)) {
      e.stopPropagation();
    }
  }, []);

  return (
    <div
      className={cn(
        'py-1',
        'supports-[height:1cqh]:[--funnel-editor-h:calc(100cqh_-_132px)]',
        'not-supports-[height:1cqh]:[--funnel-editor-h:calc(min(520px,100dvh_-_348px)_-_80px)]',
      )}
      onMouseDown={preventDragFromInteractiveElements}
    >
      <div
        className='grid max-h-(--funnel-editor-h) grid-cols-1 grid-rows-[minmax(3rem,1fr)_auto_auto] gap-2 overflow-hidden py-1 pl-1'
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
                propertyKeys={propertyKeys}
                valueError={Boolean(showEmptyValueErrors) && !filter.values.some(isNonEmptyValue)}
                hideClearAllButton
                useExtendedRange
                formatLength={isMobile ? 20 : 35}
                className={cn(
                  'md:grid-cols-[minmax(0,8fr)_minmax(0,2fr)_minmax(0,2fr)]',
                  'md:[grid-template-areas:"col_op_op"_"val_val_delete"]!',
                  'md:grid-rows-[auto_auto] md:border',
                  'xl:grid-cols-[minmax(0,4fr)_minmax(0,2fr)_minmax(0,5fr)_auto]',
                  'xl:[grid-template-areas:"col_op_val_delete"]!',
                  'xl:grid-rows-1 xl:border-0',
                )}
              />
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className='flex items-center justify-between gap-2 px-1'>
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
                variant='ghost'
                size='icon'
                className='size-8 cursor-pointer text-muted-foreground hover:text-foreground'
                onClick={() => setIsSaveDialogOpen(true)}
                disabled={!hasValidFilters || isLimitDisabled}
              >
                <SaveIcon className='h-4 w-4' />
              </Button>
            )}
          </DisabledTooltip>
        </div>
        <SavedFiltersSection
          className="pr-1 [&_[data-slot=collapsible-trigger]]:pr-2 [&_[data-slot=saved-filters-collapsible-content]]:grid-rows-[fit-content(calc(var(--funnel-editor-h)*5/9))]"
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
