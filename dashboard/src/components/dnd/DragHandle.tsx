'use client';

import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

type DragHandleProps = {
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  label: string;
  className?: string;
};

/**
 * Grip marker that activates dnd-kit dragging for a sortable item. Pass the
 * `attributes`/`listeners` from `useSortable`, and forward `setActivatorNodeRef`
 * as the ref when the handle is separate from the sortable node.
 */
export const DragHandle = forwardRef<HTMLButtonElement, DragHandleProps>(function DragHandle(
  { attributes, listeners, label, className },
  ref,
) {
  return (
    <button
      ref={ref}
      type='button'
      aria-label={label}
      {...attributes}
      {...listeners}
      className={cn(
        'text-muted-foreground/60 hover:text-foreground flex items-center justify-center transition-colors',
        'cursor-grab active:cursor-grabbing',
        // Stop the touch long-press from selecting / zooming / showing the iOS callout while grabbing
        'touch-none select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]',
        'focus-visible:ring focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      <GripVertical className='size-4' />
    </button>
  );
});
