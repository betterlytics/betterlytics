'use client';

import {
  AutoScrollActivator,
  closestCenter,
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlusIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type Ref } from 'react';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { createEmptyQueryFilter } from '@/entities/analytics/filter.entities';
import type { FunnelStep } from '@/entities/analytics/funnels.entities';
import { cn } from '@/lib/utils';

import FunnelStepAccordionItem from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/funnels/FunnelStepAccordionItem';

type FunnelStepAccordionProps = {
  steps: FunnelStep[];
  initialOpenId: string | undefined;
  onReorder: (next: FunnelStep[]) => void;
  onUpdateStep: (step: FunnelStep) => void;
  onRemoveStep: (id: string) => void;
  globalPropertyKeys?: string[];
  hasAttemptedSubmit: boolean;
  className?: string;
  listRef?: Ref<HTMLDivElement>;
  onAddStep: () => void;
  addStepLabel: string;
};

export function FunnelStepAccordion({
  steps,
  initialOpenId,
  onReorder,
  onUpdateStep,
  onRemoveStep,
  globalPropertyKeys,
  hasAttemptedSubmit,
  className,
  listRef,
  onAddStep,
  addStepLabel,
}: FunnelStepAccordionProps) {
  const [openStepId, setOpenStepId] = useState<string | undefined>(initialOpenId);
  const [isDragging, setIsDragging] = useState(false);

  const draggedItemPriorOpenRef = useRef<{ id: string; wasOpen: boolean } | null>(null);
  const draggedStepsRef = useRef<FunnelStep[] | null>(null);
  const prevIdsRef = useRef<string[]>(steps.map((s) => s.id));
  const userInitiatedOpenRef = useRef<string | null>(null);
  // Set to the id of a freshly-appended step so the item can keep the list
  // pinned to the bottom while its expand animation runs (keeping it + the
  // sticky Add Step button fully in view).
  const appendedStepIdRef = useRef<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const currentIds = steps.map((s) => s.id);
    const appended = currentIds.filter((id) => !prevIdsRef.current.includes(id));
    if (appended.length > 0) {
      appendedStepIdRef.current = appended[appended.length - 1];
      // Show the new (still collapsed) step right away instead of letting it
      // render out of view behind the sticky Add Step button.
      const scroller = scrollerRef.current;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }
    setOpenStepId((prev) => {
      if (appended.length > 0) return appended[appended.length - 1];
      return prev && currentIds.includes(prev) ? prev : undefined;
    });
    prevIdsRef.current = currentIds;
  }, [steps]);

  useEffect(() => {
    if (!isDragging) return;
    document.body.classList.add('dnd-dragging');
    return () => {
      document.body.classList.remove('dnd-dragging');
    };
  }, [isDragging]);

  const handleRequestRemoval = useCallback(
    (id: string) => {
      setOpenStepId((prev) => (prev === id ? undefined : prev));
      if (steps.length <= 2) {
        onUpdateStep({
          id,
          name: '',
          filters: [createEmptyQueryFilter()],
        });
      } else {
        onRemoveStep(id);
      }
    },
    [steps.length, onUpdateStep, onRemoveStep],
  );

  const restoreDraggedOpenState = useCallback(() => {
    const snapshot = draggedItemPriorOpenRef.current;
    draggedItemPriorOpenRef.current = null;
    if (snapshot?.wasOpen) {
      setOpenStepId(snapshot.id);
    }
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setIsDragging(true);
      draggedStepsRef.current = steps;
      const id = String(event.active.id);
      setOpenStepId((prev) => {
        const wasOpen = prev === id;
        draggedItemPriorOpenRef.current = { id, wasOpen };
        return wasOpen ? undefined : prev;
      });
    },
    [steps],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      const snapshot = draggedStepsRef.current ?? steps;
      draggedStepsRef.current = null;
      const { active, over } = event;
      if (!over || active.id === over.id) {
        restoreDraggedOpenState();
        return;
      }
      const oldIndex = snapshot.findIndex((s) => s.id === active.id);
      const newIndex = snapshot.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        restoreDraggedOpenState();
        return;
      }
      onReorder(arrayMove(snapshot, oldIndex, newIndex));
      restoreDraggedOpenState();
    },
    [steps, onReorder, restoreDraggedOpenState],
  );

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    draggedStepsRef.current = null;
    restoreDraggedOpenState();
  }, [restoreDraggedOpenState]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      autoScroll={{
        interval: 16,
        acceleration: 12,
        threshold: { x: 0, y: 0.1 },
        layoutShiftCompensation: false,
        activator: AutoScrollActivator.DraggableRect,
        canScroll: (el) => el !== document.scrollingElement,
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={scrollerRef}
        data-slot='steps-scroll'
        className={cn(
          'overflow-x-hidden overflow-y-auto overscroll-contain',
          '[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]',
          '[&::-webkit-scrollbar]:w-2',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border',
          '[&::-webkit-scrollbar-track]:bg-transparent',
          'max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden',
          className,
        )}
      >
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <Accordion
            ref={listRef}
            type='single'
            collapsible
            value={openStepId ?? ''}
            onValueChange={(value) => {
              const next = value || undefined;
              userInitiatedOpenRef.current = next ?? null;
              setOpenStepId(next);
            }}
            className='flex flex-col gap-3 pr-1 pt-3 pb-1 sm:pr-3'
          >
            {steps.map((step, index) => (
              <FunnelStepAccordionItem
                key={step.id}
                step={step}
                index={index}
                showEmptyError={hasAttemptedSubmit}
                canRemoveStep={steps.length > 2}
                onUpdate={onUpdateStep}
                onRequestRemoval={handleRequestRemoval}
                globalPropertyKeys={globalPropertyKeys}
                userInitiatedOpenRef={userInitiatedOpenRef}
                appendedStepIdRef={appendedStepIdRef}
              />
            ))}
          </Accordion>
        </SortableContext>

        {/* Sits in-flow under the last step, but pins to the bottom of the
            scroll area when the list overflows (steps scroll underneath). */}
        <div className='bg-background sticky -bottom-px z-10 pl-7 pr-1 pt-2 pb-2 shadow-[0_-10px_12px_-6px_var(--background)] sm:pl-10 sm:pr-3'>
          <Button variant='outline' onClick={onAddStep} className='w-full cursor-pointer'>
            <PlusIcon className='size-4' /> {addStepLabel}
          </Button>
        </div>
      </div>
    </DndContext>
  );
}
