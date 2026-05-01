'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';

import { AccordionItem, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QueryFiltersSelectorContent } from '@/components/filters/QueryFiltersSelectorContent';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { cn } from '@/lib/utils';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';
import { generateTempId } from '@/utils/temporaryId';
import type { FunnelStep } from '@/entities/analytics/funnels.entities';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

function createEmptyFilter(): QueryFilter {
  return { id: generateTempId(), column: 'url', operator: '=', values: [] };
}

const initOrDefault = (filters: QueryFilter[]): QueryFilter[] =>
  filters.length > 0 ? filters : [createEmptyFilter()];

type FunnelStepAccordionItemProps = {
  step: FunnelStep;
  index: number;
  showEmptyError: boolean;
  onUpdate: (next: FunnelStep) => void;
  onRequestRemoval: (id: string) => void;
  globalPropertyKeys?: string[];
};

function FunnelStepAccordionItemComponent({
  step,
  index,
  showEmptyError,
  onUpdate,
  onRequestRemoval,
  globalPropertyKeys,
}: FunnelStepAccordionItemProps) {
  const t = useTranslations('components.funnels.create');
  const tFilters = useTranslations('components.filters');

  const showNameError = showEmptyError && step.name.trim() === '';
  const filterCount = filterEmptyQueryFilters(step.filters).length;
  const showFilterEmptyError = showEmptyError && filterCount === 0;
  const filterCountText =
    filterCount === 0
      ? t('filterCount.none')
      : filterCount === 1
        ? t('filterCount.one')
        : t('filterCount.many', { count: filterCount });

  const sortable = useSortable({ id: step.id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const localQueryFilters = useQueryFilters(initOrDefault(step.filters));
  useEffect(() => {
    localQueryFilters.setQueryFilters(initOrDefault(step.filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.filters]);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false);

  const handleApply = useCallback(
    (applied: QueryFilter[]) => {
      onUpdate({ ...step, filters: applied });
    },
    [onUpdate, step],
  );

  const handleCancel = useCallback(() => {
    localQueryFilters.setQueryFilters(initOrDefault(step.filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.filters]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('group/step relative', isDragging && 'z-10 opacity-80')}
      {...attributes}
      {...listeners}
      tabIndex={-1}
    >
      <AccordionItem
        value={step.id}
        className={cn(
          'group/item bg-card relative rounded-md border transition-colors',
          'data-[state=open]:border-primary/40',
          showFilterEmptyError && 'border-destructive/40',
        )}
      >
        <AccordionPrimitive.Header className='relative flex'>
          <div className='relative flex flex-1'>
            {/* Transparent trigger overlay — captures clicks for accordion toggling without
                illegally nesting <input> inside <button>. Clicks fall through the visual row
                (pointer-events-none) to this overlay, except where elements re-enable
                pointer-events (e.g. the name input and the delete button). */}
            <AccordionPrimitive.Trigger
              aria-label={t('aria.toggleStep', { index: index + 1 })}
              className={cn(
                'peer/trigger absolute inset-0 cursor-grab rounded-md active:cursor-grabbing',
                'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
              )}
            />
            <div className='pointer-events-none relative grid w-full grid-cols-[10rem_1fr_auto_auto] items-center gap-2.5 px-3 py-2.5 select-none'>
              <Input
                value={step.name}
                onChange={(e) => onUpdate({ ...step, name: e.target.value })}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={tFilters('namePlaceholder')}
                className={cn('pointer-events-auto h-8 w-40 cursor-text', showNameError && 'border-destructive')}
              />

              <span aria-hidden className='h-full' />

              <Badge
                variant='secondary'
                className={cn(
                  'h-5 px-2 text-xs font-medium',
                  showFilterEmptyError && 'border-destructive/50 bg-destructive/10 text-destructive',
                )}
              >
                {filterCountText}
              </Badge>

              <ChevronDown className='text-muted-foreground size-4 transition-transform duration-150 group-data-[state=open]/item:rotate-180' />
            </div>
          </div>

          {/* Step number — half outside the card on the left edge */}
          <span
            aria-hidden
            className='bg-muted text-muted-foreground pointer-events-none absolute top-1/2 left-0 z-10 inline-flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs'
          >
            {index + 1}
          </span>
        </AccordionPrimitive.Header>

        {/* Delete — top-right corner pip, conditionally visible on hover / focus-within / open */}
        <Button
          type='button'
          variant='destructive'
          size='icon'
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRequestRemoval(step.id);
          }}
          aria-label={t('aria.deleteStep', { index: index + 1 })}
          className={cn(
            'cursor-pointer',
            'absolute top-0 right-0 z-10 size-5 -translate-y-1/2 translate-x-1/2 rounded-full opacity-0 transition-opacity duration-150',
            'group-hover/step:opacity-100 focus-visible:opacity-100',
          )}
        >
          <X className='size-3' />
        </Button>

        <AccordionContent className='bg-muted/10 border-t px-3 py-3'>
          <QueryFiltersSelectorContent
            initialFilters={step.filters}
            filters={localQueryFilters}
            isSavedFiltersOpen={isSavedFiltersOpen}
            setIsSavedFiltersOpen={setIsSavedFiltersOpen}
            onApply={handleApply}
            onCancel={handleCancel}
            globalPropertyKeys={globalPropertyKeys}
          />
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

export const FunnelStepAccordionItem = memo(FunnelStepAccordionItemComponent);
