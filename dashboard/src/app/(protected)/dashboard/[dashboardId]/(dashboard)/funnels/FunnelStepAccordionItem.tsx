'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useMemo, useRef, type AnimationEvent, type RefObject } from 'react';

import { FunnelStepFiltersEditor } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/funnels/FunnelStepFiltersEditor';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { QueryFilter } from '@/entities/analytics/filter.entities';
import type { FunnelStep } from '@/entities/analytics/funnels.entities';
import { cn } from '@/lib/utils';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';

type FunnelStepAccordionItemProps = {
  step: FunnelStep;
  index: number;
  showEmptyError: boolean;
  canRemoveStep: boolean;
  onUpdate: (next: FunnelStep) => void;
  onRequestRemoval: (id: string) => void;
  globalPropertyKeys?: string[];
  userInitiatedOpenRef: RefObject<string | null>;
};

function FunnelStepAccordionItemComponent({
  step,
  index,
  showEmptyError,
  canRemoveStep,
  onUpdate,
  onRequestRemoval,
  globalPropertyKeys,
  userInitiatedOpenRef,
}: FunnelStepAccordionItemProps) {
  const t = useTranslations('components.funnels.create');
  const tFilters = useTranslations('components.filters');

  const showNameError = showEmptyError && step.name.trim() === '';
  const filterCount = filterEmptyQueryFilters(step.filters).length;
  const showFilterEmptyError = showEmptyError && filterCount === 0;

  const isStepBlank = step.name.trim() === '' && filterCount === 0;
  const disableDelete = !canRemoveStep && isStepBlank;

  const sortable = useSortable({ id: step.id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const { onKeyDown: _keyboardActivator, ...pointerListeners } = listeners ?? {};

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const composedRef = useCallback(
    (node: HTMLDivElement | null) => {
      wrapperRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  const handleContentAnimationEnd = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (e.currentTarget.dataset.state !== 'open') return;
      if (userInitiatedOpenRef.current !== step.id) return;
      wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    [step.id, userInitiatedOpenRef],
  );

  const stepRef = useRef(step);
  stepRef.current = step;

  const handleFiltersChange = useCallback(
    (next: QueryFilter[]) => {
      onUpdate({ ...stepRef.current, filters: next });
    },
    [onUpdate],
  );

  const StepTrigger = useMemo(() => {
    const toggleLabel = t('tooltip.toggleStep', { index: index + 1 });
    const ariaLabel = step.name.trim() ? `${toggleLabel}: ${step.name}` : toggleLabel;
    const { onKeyDown: _kd, ...pointerListeners } = listeners ?? {};
    return (
      <AccordionPrimitive.Trigger
        data-slot='step-trigger'
        aria-label={ariaLabel}
        title={toggleLabel}
        onKeyDown={(e) => {
          // Let radix handle space/enter key presses.
          if (e.key === ' ' || e.key === 'Enter') {
            e.stopPropagation();
          }
        }}
        className={cn(
          'absolute inset-0 cursor-pointer rounded-md',
          'focus-visible:ring focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none',
        )}
      >
        <div
          aria-hidden
          {...pointerListeners}
          className={cn(
            'dark:border-border border-foreground/30 bg-card shadow',
            'flex size-4 items-center justify-center rounded-full border p-3',
            'absolute top-1/2 left-0 z-10 -translate-y-1/2 -translate-x-3/5',
          )}
        >
          <p className='text-foreground text-xs leading-none tabular-nums'>{index + 1}</p>
        </div>
      </AccordionPrimitive.Trigger>
    );
  }, [t, step.name, index, listeners]);

  const FoldIndicator = useMemo(
    () => (
      <ChevronDown
        data-slot='step-fold-indicator'
        aria-hidden='true'
        className={cn(
          'text-muted-foreground size-4 rounded-md',
          'group-data-[state=open]/item:rotate-180 transition-transform duration-200',
          'group-has-[[data-slot=step-trigger]:focus-visible]/header:ring-2 group-has-[[data-slot=step-trigger]:focus-visible]/header:ring-ring/50',
          'group-has-[[data-slot=step-trigger]:focus-visible]/header:border group-has-[[data-slot=step-trigger]:focus-visible]/header:border-ring',
        )}
      />
    ),
    [],
  );

  const DeleteStepButton = useMemo(
    () => (
      <DisabledTooltip
        disabled={disableDelete}
        message={t('tooltip.minStepsHint', { count: 2 })}
        wrapperClassName='pointer-events-auto inline-flex'
      >
        {(isDisabled) => (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            disabled={isDisabled}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRequestRemoval(step.id);
            }}
            aria-label={t('tooltip.deleteStep', { index: index + 1 })}
            className={cn(
              'pointer-events-auto cursor-pointer',
              'size-8 text-muted-foreground hover:text-foreground',
              '[body.dnd-dragging_&]:pointer-events-none',
            )}
          >
            <Trash2 className='size-4' />
          </Button>
        )}
      </DisabledTooltip>
    ),
    [disableDelete, step.id, index, onRequestRemoval, t],
  );

  const StepHeader = useMemo(
    () => (
      <AccordionPrimitive.Header className='group/header relative flex'>
        <div className='relative flex flex-1'>
          <div
            className={cn(
              'relative z-10 grid w-full items-center',
              'grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[10rem_1fr_auto_auto_auto]',
              'gap-1.5 sm:gap-2.5',
              'pr-2 pl-4 py-2 sm:pr-3 sm:pl-5 sm:py-2.5',
              'pointer-events-none select-none',
            )}
          >
            <Input
              value={step.name}
              onChange={(e) => onUpdate({ ...step, name: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={tFilters('namePlaceholder')}
              data-focus-target
              className={cn(
                'pointer-events-auto cursor-text',
                'h-8 w-full sm:w-60',
                'placeholder:text-muted-foreground/70',
                showNameError && 'border-destructive',
              )}
            />
            <span aria-hidden className='h-full' />
            <Badge
              variant='secondary'
              className={cn(
                'hidden sm:inline-flex',
                'h-5 px-2 text-xs font-medium',
                showFilterEmptyError && 'border-destructive/50 bg-destructive/10 text-destructive',
              )}
            >
              {t('filterCount', { count: filterCount })}
            </Badge>
            {DeleteStepButton}
            {FoldIndicator}
          </div>
          {StepTrigger}
        </div>
      </AccordionPrimitive.Header>
    ),
    [step, showNameError, showFilterEmptyError, filterCount, t, onUpdate, tFilters, StepTrigger, FoldIndicator, DeleteStepButton],
  );

  return (
    <div
      ref={composedRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'relative flex items-start',
        'gap-2 sm:gap-4',
        'transition-[filter] duration-150 will-change-transform',
        'scroll-mt-2.5',
        isDragging && 'z-10 drop-shadow-lg',
      )}
      {...pointerListeners}
    >
      <div
        {...attributes}
        {...listeners}
        aria-label={t('tooltip.reorderStep', { index: index + 1 })}
        className={cn(
          'hidden sm:flex',
          'text-muted-foreground/60 hover:text-foreground transition-colors',
          'h-[2.25rem] w-6 items-center justify-center rounded-md my-2',
          'cursor-grab active:cursor-grabbing',
          'focus-visible:ring focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none',
        )}
      >
        <GripVertical className='size-4' />
      </div>

      <AccordionItem
        value={step.id}
        className={cn(
          'group/item',
          'bg-card dark:bg-secondary/50',
          isDragging && 'dark:bg-secondary',
          'relative flex-1 rounded-md border transition-colors',
          'data-[state=open]:border-primary/40',
        )}
      >
        {StepHeader}
        <AccordionContent
          onAnimationEnd={handleContentAnimationEnd}
          className={'bg-muted/10 relative px-3 pb-1 border-t cursor-grab active:cursor-grabbing'}
        >
          <div className={'bg-primary/60 absolute left-0 w-0.5 h-full rounded-bl-md'} />
          <FunnelStepFiltersEditor
            filters={step.filters}
            onChange={handleFiltersChange}
            globalPropertyKeys={globalPropertyKeys}
          />
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

const FunnelStepAccordionItem = memo(FunnelStepAccordionItemComponent);
FunnelStepAccordionItem.displayName = 'FunnelStepAccordionItem';
export default FunnelStepAccordionItem;