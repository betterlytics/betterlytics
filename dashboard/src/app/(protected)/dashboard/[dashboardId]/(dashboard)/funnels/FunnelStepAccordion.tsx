'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useEffect, useRef, useState, type Ref } from 'react';

import { Accordion } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}: FunnelStepAccordionProps) {
  const [openStepId, setOpenStepId] = useState<string | undefined>(initialOpenId);
  
  const draggedItemPriorOpenRef = useRef<{ id: string; wasOpen: boolean } | null>(null);
  const draggedStepsRef = useRef<FunnelStep[] | null>(null);
  const prevIdsRef = useRef<string[]>(steps.map((s) => s.id));
  
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const currentIds = steps.map((s) => s.id);
    const appended = currentIds.filter((id) => !prevIdsRef.current.includes(id));
    setOpenStepId((prev) => {
      if (appended.length > 0) return appended[appended.length - 1];
      return prev && currentIds.includes(prev) ? prev : undefined;
    });
    prevIdsRef.current = currentIds;
  }, [steps]);

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
    draggedStepsRef.current = null;
    restoreDraggedOpenState();
  }, [restoreDraggedOpenState]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea
        className={cn(
          'lg:-mr-3',
          'max-sm:[&_[data-slot=scroll-area-scrollbar]]:hidden',
          className,
        )}
      >
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <Accordion
            ref={listRef}
            type='single'
            collapsible
            value={openStepId ?? ''}
            onValueChange={(value) => setOpenStepId(value || undefined)}
            className='flex flex-col gap-3 py-3 px-3 sm:pl-1 lg:pr-5'
          >
            {steps.map((step, index) => (
              <FunnelStepAccordionItem
                key={step.id}
                step={step}
                index={index}
                showEmptyError={hasAttemptedSubmit}
                onUpdate={onUpdateStep}
                onRequestRemoval={handleRequestRemoval}
                globalPropertyKeys={globalPropertyKeys}
              />
            ))}
          </Accordion>
        </SortableContext>
      </ScrollArea>
    </DndContext>
  );
}
