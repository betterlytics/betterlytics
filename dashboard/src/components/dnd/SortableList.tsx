'use client';

import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCallback, useState, type ReactNode } from 'react';

import { reorderOnDragEnd, useDndDraggingClass, useSortableSensors } from '@/components/dnd/sortable';

type SortableListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  onReorder: (next: T[]) => void;
  children: ReactNode;
  className?: string;
};

/**
 * Vertical drag-and-drop list. Wraps children in a dnd-kit context and calls
 * `onReorder` with the new order when a drag settles. Each child must call
 * `useSortable({ id })` with an id from `getId` (see {@link DragHandle}).
 */
export function SortableList<T>({ items, getId, onReorder, children, className }: SortableListProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const sensors = useSortableSensors();
  useDndDraggingClass(isDragging);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      const next = reorderOnDragEnd(items, event, getId);
      if (next) onReorder(next);
    },
    [items, getId, onReorder],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setIsDragging(false)}
    >
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}
