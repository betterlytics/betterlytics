'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import { Pencil, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DragHandle } from '@/components/dnd/DragHandle';
import { Input } from '@/components/ui/input';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { defaultPublicMonitorName } from '@/entities/analytics/statusPage/statusPage.helpers';
import { operationalStateToTone } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import { cn } from '@/lib/utils';
import { MonitorStatusMeta } from './MonitorStatusMeta';
import type { MonitorRow } from './monitorRow';

type SortableNameRowProps = {
  row: MonitorRow;
  justAdded?: boolean;
  onPublicNameChange: (publicName: string) => void;
  onRemove: () => void;
};

let measureCtx: CanvasRenderingContext2D | null = null;

export function SortableNameRow({ row, justAdded, onPublicNameChange, onRemove }: SortableNameRowProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: row.monitorCheckId,
    });

  const outerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pencilRef = useRef<SVGSVGElement>(null);
  const [leaving, setLeaving] = useState(false);

  const placeholder = defaultPublicMonitorName(row);
  const isMuted = row.operationalState != null && operationalStateToTone(row.operationalState) === 'neutral';

  useLayoutEffect(() => {
    const input = inputRef.current;
    const pencil = pencilRef.current;
    if (!input || !pencil) return;
    measureCtx ??= document.createElement('canvas').getContext('2d');
    if (!measureCtx) return;
    const style = getComputedStyle(input);
    measureCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const textWidth = measureCtx.measureText(row.publicName || placeholder).width;
    pencil.style.left = `${Math.min(8 + textWidth + 6, input.clientWidth - 20)}px`;
  }, [row.publicName, placeholder]);

  useLayoutEffect(() => {
    if (justAdded) outerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [justAdded]);

  // Collapse-out removal: freeze the height, transition it to zero, then commit.
  const startRemove = () => {
    const el = outerRef.current;
    if (!el || leaving) return;
    el.style.height = `${el.offsetHeight}px`;
    setLeaving(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        el.style.height = '0px';
        el.style.paddingTop = '0px';
        el.style.paddingBottom = '0px';
        el.style.marginTop = '0px';
        el.style.marginBottom = '0px';
        el.style.opacity = '0';
      }),
    );
  };

  return (
    // Single node: the sortable ref must sit on the rows container's direct child,
    // or restrictToParentElement would pin dragging inside a row-sized wrapper.
    <div
      ref={(node) => {
        setNodeRef(node);
        outerRef.current = node;
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onTransitionEnd={(e) => {
        if (leaving && e.propertyName === 'height') onRemove();
      }}
      className={cn(
        'border-border bg-card flex items-center gap-2 rounded-lg border p-3',
        isDragging && 'z-10 drop-shadow-lg',
        justAdded && 'animate-monitor-row-added',
        leaving &&
          'pointer-events-none overflow-hidden transition-[height,margin,padding,opacity] duration-200 ease-out',
      )}
    >
      <DragHandle
        ref={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
        label={t('reorderMonitor')}
        className='h-7 w-5 flex-none'
      />
      <div className='min-w-0 flex-1'>
        <div className='group/name relative -mx-2'>
          <Input
            ref={inputRef}
            id={`public-name-${row.monitorCheckId}`}
            aria-label={t('publicNamePlaceholder')}
            value={row.publicName}
            maxLength={STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX}
            placeholder={placeholder}
            onChange={(e) => onPublicNameChange(e.target.value)}
            className={cn(
              'hover:bg-muted/50 focus-visible:bg-background dark:focus-visible:bg-input/30 h-7 w-full truncate border-transparent bg-transparent px-2 pr-6 text-sm font-medium shadow-none transition-colors dark:bg-transparent',
              isMuted && 'text-muted-foreground',
            )}
          />
          <Pencil
            ref={pencilRef}
            className='text-muted-foreground/40 pointer-events-none absolute top-1/2 left-0 h-3.5 w-3.5 -translate-y-1/2 transition-opacity group-focus-within/name:opacity-0'
          />
        </div>
        <div className='text-muted-foreground truncate text-xs'>{row.url}</div>
      </div>
      <MonitorStatusMeta row={row} />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={startRemove}
        title={t('wizard.removeFromPage')}
        aria-label={t('wizard.removeFromPage')}
        className='text-muted-foreground hover:text-destructive size-7 flex-none cursor-pointer'
      >
        <X className='h-3.5 w-3.5' />
      </Button>
    </div>
  );
}
