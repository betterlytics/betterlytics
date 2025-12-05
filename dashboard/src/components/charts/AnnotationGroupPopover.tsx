'use client';

import React, { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { Pencil, Trash2 } from 'lucide-react';
import { type AnnotationGroup } from '@/utils/chartAnnotations';
import { type ChartAnnotation } from './AnnotationMarker';

interface AnnotationGroupPopoverProps {
  group: AnnotationGroup | null;
  anchorRect: DOMRect | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onEdit: (annotation: ChartAnnotation) => void;
  onDelete: (id: string) => void;
}

const AnnotationGroupPopover: React.FC<AnnotationGroupPopoverProps> = ({
  group,
  anchorRect,
  containerRef,
  onClose,
  onEdit,
  onDelete,
}) => {
  const locale = useLocale();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!group) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay adding listener to avoid immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [group, onClose]);

  // Close on escape
  useEffect(() => {
    if (!group) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [group, onClose]);

  if (!group || !anchorRect || !containerRef.current) return null;

  // Calculate position relative to container
  const containerRect = containerRef.current.getBoundingClientRect();
  const left = anchorRect.left - containerRect.left + anchorRect.width / 2;
  const top = anchorRect.bottom - containerRect.top + 8;

  const bucketDate = new Date(group.bucketDate);

  return (
    <div
      ref={popoverRef}
      className='bg-popover text-popover-foreground absolute z-50 max-w-[280px] min-w-[220px] rounded-lg border shadow-lg'
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Header */}
      <div className='border-b px-3 py-2'>
        <p className='text-muted-foreground text-xs font-medium'>
          {bucketDate.toLocaleDateString(locale, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
        <p className='text-muted-foreground mt-0.5 text-xs'>
          {group.annotations.length} annotation{group.annotations.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className='max-h-[200px] overflow-y-auto py-1'>
        {group.annotations.map((annotation) => (
          <div key={annotation.id} className='hover:bg-muted/50 group flex items-center gap-2 px-3 py-2'>
            <div
              className='h-2.5 w-2.5 shrink-0 rounded-full'
              style={{ backgroundColor: annotation.color ?? '#f59e0b' }}
            />

            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{annotation.label}</p>
              {annotation.description && (
                <p className='text-muted-foreground truncate text-xs'>{annotation.description}</p>
              )}
            </div>

            <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(annotation);
                  onClose();
                }}
                className='text-muted-foreground hover:text-foreground rounded p-1 transition-colors'
                title='Edit'
              >
                <Pencil className='h-3.5 w-3.5' />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(annotation.id);
                  onClose();
                }}
                className='text-muted-foreground hover:text-destructive rounded p-1 transition-colors'
                title='Delete'
              >
                <Trash2 className='h-3.5 w-3.5' />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

AnnotationGroupPopover.displayName = 'AnnotationGroupPopover';

export default AnnotationGroupPopover;
