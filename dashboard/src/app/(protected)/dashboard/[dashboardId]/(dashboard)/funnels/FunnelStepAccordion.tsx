'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDndMonitor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import { Accordion } from '@/components/ui/accordion';
import { BAScrollContainer } from '@/components/ba-scroll-container';
import { cn } from '@/lib/utils';
import type { FunnelStep } from '@/entities/analytics/funnels.entities';

import { FunnelStepAccordionItem } from './FunnelStepAccordionItem';

type FunnelStepAccordionProps = {
  steps: FunnelStep[];
  initialOpenIds: string[];
  onReorder: (next: FunnelStep[]) => void;
  onUpdateStep: (step: FunnelStep) => void;
  onRemoveStep: (id: string) => void;
  globalPropertyKeys?: string[];
  hasAttemptedSubmit: boolean;
  className?: string;
};

export function FunnelStepAccordion({
  steps,
  initialOpenIds,
  onReorder,
  onUpdateStep,
  onRemoveStep,
  globalPropertyKeys,
  hasAttemptedSubmit,
  className,
}: FunnelStepAccordionProps) {
  const [openStepIds, setOpenStepIds] = useState<string[]>(initialOpenIds);

  // Local-during-drag mirror — keeps the preview tRPC query stable while the user drags.
  const [localSteps, setLocalSteps] = useState(steps);
  const isDraggingRef = useRef(false);
  useEffect(() => {
    if (!isDraggingRef.current) setLocalSteps(steps);
  }, [steps]);

  // Diff effect: prune ids that no longer exist; auto-expand any step that just got appended.
  const prevIdsRef = useRef<string[]>(steps.map((s) => s.id));
  useEffect(() => {
    const prevIds = prevIdsRef.current;
    const currentIds = steps.map((s) => s.id);
    const appended = currentIds.filter((id) => !prevIds.includes(id));
    setOpenStepIds((prev) => {
      const pruned = prev.filter((id) => currentIds.includes(id));
      return appended.length > 0 ? [...pruned, ...appended] : pruned;
    });
    prevIdsRef.current = currentIds;
  }, [steps]);

  const handleRequestRemoval = useCallback(
    (id: string) => {
      if (steps.length <= 2) {
        onUpdateStep({ id, name: '', filters: [] });
      } else {
        setOpenStepIds((prev) => prev.filter((openId) => openId !== id));
        onRemoveStep(id);
      }
    },
    [steps.length, onUpdateStep, onRemoveStep],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    // v1: behaviour B (drag-the-whole-card). Behaviour A (auto-collapse on drag-start)
    // plumbing intentionally left commented for next-iteration activation:
    //   const preDragOpenIds = openStepIds;
    //   setOpenStepIds((prev) => prev.filter((id) => id !== active.id));
    //   preDragOpenIdsRef.current = preDragOpenIds;
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      isDraggingRef.current = false;
      if (!over || active.id === over.id) {
        setLocalSteps(steps);
        return;
      }
      const oldIndex = localSteps.findIndex((s) => s.id === active.id);
      const newIndex = localSteps.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const reordered = arrayMove(localSteps, oldIndex, newIndex);
      setLocalSteps(reordered);
      onReorder(reordered);
    },
    [localSteps, onReorder, steps],
  );

  const handleDragCancel = useCallback(() => {
    isDraggingRef.current = false;
    setLocalSteps(steps);
  }, [steps]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <DragChevronGate>
        {(isDragging) => (
          <BAScrollContainer
            className={cn(
              className,
              isDragging &&
                '[&_[data-slot=ba-scroll-container-indicator-up]]:pointer-events-none [&_[data-slot=ba-scroll-container-indicator-down]]:pointer-events-none',
            )}
          >
            <SortableContext items={localSteps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <Accordion
                type='multiple'
                value={openStepIds}
                onValueChange={setOpenStepIds}
                className='flex flex-col gap-2'
              >
                {localSteps.map((step, index) => (
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
          </BAScrollContainer>
        )}
      </DragChevronGate>
    </DndContext>
  );
}

function DragChevronGate({ children }: { children: (isDragging: boolean) => React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  useDndMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    onDragCancel: () => setIsDragging(false),
  });
  return <>{children(isDragging)}</>;
}
