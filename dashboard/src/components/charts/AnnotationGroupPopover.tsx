'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { resolveAnnotationColor, type AnnotationGroup } from '@/utils/chartAnnotations';
import { type ChartAnnotation } from '@/entities/annotation';
import { useTheme } from 'next-themes';

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
  const t = useTranslations('components.annotations.popover');

  if (!containerRef.current) return null;

  // Calculate anchor position relative to container
  const containerRect = containerRef.current.getBoundingClientRect();
  const anchorLeft = anchorRect ? anchorRect.left - containerRect.left + anchorRect.width / 2 : 0;
  const anchorTop = anchorRect ? anchorRect.bottom - containerRect.top : 0;

  const bucketDate = group ? new Date(group.bucketDate) : null;
  const { resolvedTheme } = useTheme();
  const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light';

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
                {t('annotationsCount', { count: group.annotations.length })}
              </p>
            </div>

            {/* Annotations list */}
            <div className='max-h-[200px] overflow-y-auto py-1'>
              {group.annotations.map((annotation) => (
                <div key={annotation.id} className='hover:bg-muted/50 group flex items-center gap-2 px-3 py-2'>
                  <div
                    className='h-2.5 w-2.5 shrink-0 rounded-full'
                    style={{ backgroundColor: resolveAnnotationColor(annotation.colorToken, themeMode) }}
                  />

                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{annotation.label}</p>
                    {annotation.description && (
                      <p className='text-muted-foreground line-clamp-2 text-xs leading-5 whitespace-normal'>
                        {annotation.description}
                      </p>
                    )}
                  </div>

                  <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='cursor-pointer'
                      onClick={() => {
                        onEdit(annotation);
                        onClose();
                      }}
                      aria-label={t('editAria')}
                    >
                      <Pencil className='h-3.5 w-3.5' />
                      <span className='sr-only'>{t('edit')}</span>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-destructive hover:text-destructive cursor-pointer'
                      onClick={() => {
                        onDelete(annotation.id);
                        onClose();
                      }}
                      aria-label={t('deleteAria')}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                      <span className='sr-only'>{t('delete')}</span>
                    </Button>
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
