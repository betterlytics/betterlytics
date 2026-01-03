'use client';

import React, { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { resolveAnnotationColor, type AnnotationGroup } from '@/utils/chartAnnotations';
import { type ChartAnnotation } from '@/entities/dashboard/annotation.entities';
import { useTheme } from 'next-themes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PermissionGate } from '../tooltip/PermissionGate';

export interface AnnotationGroupPopoverProps {
  group: AnnotationGroup | null;
  anchorRect: DOMRect | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  disableActions?: boolean;
  onClose: () => void;
  onEdit: (annotation: ChartAnnotation) => void;
  onDelete: (id: string) => void;
}

const AnnotationGroupPopover: React.FC<AnnotationGroupPopoverProps> = ({
  group,
  anchorRect,
  containerRef,
  disableActions = false,
  onClose,
  onEdit,
  onDelete,
}) => {
  const locale = useLocale();
  const t = useTranslations('components.annotations.popover');
  const { resolvedTheme } = useTheme();
  const themeMode = useMemo(() => (resolvedTheme === 'dark' ? 'dark' : 'light'), [resolvedTheme]);

  const { anchorLeft, anchorTop } = useMemo(() => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!anchorRect || !containerRect) return { anchorLeft: 0, anchorTop: 0 };
    return {
      anchorLeft: anchorRect.left - containerRect.left + anchorRect.width / 2,
      anchorTop: anchorRect.bottom - containerRect.top,
    };
  }, [anchorRect, containerRef]);

  const bucketDate = useMemo(() => (group ? new Date(group.bucketDate) : null), [group]);
  const bucketDateLabel = useMemo(() => {
    if (!bucketDate) return '';
    return bucketDate.toLocaleDateString(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [bucketDate, locale]);

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
        {group && (
          <>
            <div className='border-b px-3 py-2'>
              <p className='text-muted-foreground text-xs font-medium'>{bucketDateLabel}</p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {t('annotationsCount', { count: group.annotations.length })}
              </p>
            </div>

            <ScrollArea className='max-h-[200px]'>
              <div className='py-1'>
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

                    <PermissionGate when={!disableActions}>
                      {(isDisabled) => (
                        <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='cursor-pointer disabled:cursor-not-allowed'
                            disabled={isDisabled}
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
                            className='text-destructive hover:text-destructive cursor-pointer disabled:cursor-not-allowed'
                            disabled={isDisabled}
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
                      )}
                    </PermissionGate>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

AnnotationGroupPopover.displayName = 'AnnotationGroupPopover';

export default AnnotationGroupPopover;
