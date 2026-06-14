'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';

import { DragHandle } from '@/components/dnd/DragHandle';
import { Input } from '@/components/ui/input';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage.entities';
import { cn } from '@/lib/utils';
import type { MonitorRow } from './SortableMonitorRow';

type SortableNameRowProps = {
  row: MonitorRow;
  onPublicNameChange: (publicName: string) => void;
};

/** Drag-to-reorder + rename for an already-selected monitor (no include checkbox). */
export function SortableNameRow({ row, onPublicNameChange }: SortableNameRowProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.monitorCheckId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'border-border bg-card flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center',
        isDragging && 'z-10 drop-shadow-lg',
      )}
    >
      <DragHandle
        ref={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
        label={t('reorderMonitor')}
        className='h-9 w-5 flex-none'
      />
      <div className='min-w-0 flex-1'>
        <div className='truncate text-sm font-medium'>{row.name ?? row.url}</div>
        <div className='text-muted-foreground truncate text-xs'>{row.url}</div>
      </div>
      <Input
        value={row.publicName}
        maxLength={STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX}
        placeholder={t('publicNamePlaceholder')}
        onChange={(e) => onPublicNameChange(e.target.value)}
        className='sm:w-56'
      />
    </div>
  );
}
