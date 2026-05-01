'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
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
import type { FunnelStep } from '@/entities/analytics/funnels.entities';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

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
  const showFilterEmptyError = showEmptyError && step.filters.length === 0;

  const filterCount = step.filters.length;
  const filterCountText =
    filterCount === 0
      ? t('filterCount.none')
      : filterCount === 1
        ? t('filterCount.one')
        : t('filterCount.many', { count: filterCount });

  const sortable = useSortable({ id: step.id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const localQueryFilters = useQueryFilters(step.filters);
  useEffect(() => {
    localQueryFilters.setQueryFilters(step.filters);
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
    localQueryFilters.setQueryFilters(step.filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.filters]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('group/step relative', isDragging && 'z-10 opacity-80')}
      {...attributes}
      {...listeners}
    >
      <AccordionItem
        value={step.id}
        className={cn(
          'bg-card rounded-md border transition-colors',
          'data-[state=open]:border-primary/40',
          showFilterEmptyError && 'border-destructive/40',
        )}
      >
        <AccordionPrimitive.Header className='flex'>
          <div className='relative flex flex-1'>
            {/* Transparent trigger overlay — captures clicks for accordion toggling without
                illegally nesting <input> inside <button>. Clicks fall through the visual row
                (pointer-events-none) to this overlay, except where elements re-enable
                pointer-events (e.g. the name input and the delete button). */}
            <AccordionPrimitive.Trigger
              aria-label={t('aria.toggleStep', { index: index + 1 })}
              className={cn(
                'peer/trigger absolute inset-0 cursor-grab rounded-md active:cursor-grabbing',
                'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
              )}
            />
            <div className='pointer-events-none relative grid w-full grid-cols-[auto_1.5rem_10rem_1fr_auto_auto] items-center gap-2.5 px-3 py-2.5 select-none'>
              <ChevronDown className='text-muted-foreground size-4 transition-transform duration-150 peer-data-[state=open]/trigger:rotate-180' />

              <span className='bg-muted/30 text-muted-foreground inline-flex size-5 items-center justify-center rounded-full border text-xs'>
                {index + 1}
              </span>

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

              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-destructive pointer-events-auto size-7'
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestRemoval(step.id);
                }}
                aria-label={t('aria.deleteStep', { index: index + 1 })}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </div>
        </AccordionPrimitive.Header>

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
