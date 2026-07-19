'use client';

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEffect } from 'react';

export function useSortableSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export function useDndDraggingClass(isDragging: boolean) {
  useEffect(() => {
    if (!isDragging) return;
    document.body.classList.add('dnd-dragging');
    return () => {
      document.body.classList.remove('dnd-dragging');
    };
  }, [isDragging]);
}

export function reorderOnDragEnd<T>(items: T[], event: DragEndEvent, getId: (item: T) => string): T[] | null {
  const { active, over } = event;
  if (!over || active.id === over.id) return null;
  const oldIndex = items.findIndex((item) => getId(item) === active.id);
  const newIndex = items.findIndex((item) => getId(item) === over.id);
  if (oldIndex < 0 || newIndex < 0) return null;
  return arrayMove(items, oldIndex, newIndex);
}
