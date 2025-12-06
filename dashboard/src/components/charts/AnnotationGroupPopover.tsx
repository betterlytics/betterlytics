'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
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

  if (!containerRef.current) return null;

  // Calculate anchor position relative to container
  const containerRect = containerRef.current.getBoundingClientRect();
  const anchorLeft = anchorRect ? anchorRect.left - containerRect.left + anchorRect.width / 2 : 0;
  const anchorTop = anchorRect ? anchorRect.bottom - containerRect.top : 0;

  const bucketDate = group ? new Date(group.bucketDate) : null;

  return (
    <Popover open={!!group} onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor asChild>
        <div
          className='pointer-events-none absolute h-0 w-0'
          style={{
            left: `${anchorLeft}px`,
            top: `${anchorTop}px`,
          }}
        />
      </PopoverAnchor>

      <PopoverContent className='max-w-[280px] min-w-[220px] p-0' align='center' sideOffset={8}>
        {group && bucketDate && (
          <>
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

            {/* Annotations list */}
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
                      onClick={() => {
                        onEdit(annotation);
                        onClose();
                      }}
                      className='text-muted-foreground hover:text-foreground rounded p-1 transition-colors'
                      title='Edit'
                    >
                      <Pencil className='h-3.5 w-3.5' />
                    </button>
                    <button
                      onClick={() => {
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
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

AnnotationGroupPopover.displayName = 'AnnotationGroupPopover';

export default AnnotationGroupPopover;
