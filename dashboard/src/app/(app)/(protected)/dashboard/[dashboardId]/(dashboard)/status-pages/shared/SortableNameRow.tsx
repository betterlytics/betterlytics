'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';

import { DragHandle } from '@/components/dnd/DragHandle';
import { Input } from '@/components/ui/input';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { defaultPublicMonitorName } from '@/entities/analytics/statusPage/statusPage.helpers';
import { cn } from '@/lib/utils';
import type { MonitorRow } from './monitorRow';

type SortableNameRowProps = {
  row: MonitorRow;
  onPublicNameChange: (publicName: string) => void;
};

export function SortableNameRow({ row, onPublicNameChange }: SortableNameRowProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: row.monitorCheckId,
    });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'border-border bg-card flex items-center gap-2 rounded-lg border p-3',
        isDragging && 'z-10 drop-shadow-lg',
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
            id={`public-name-${row.monitorCheckId}`}
            aria-label={t('publicNamePlaceholder')}
            value={row.publicName}
            maxLength={STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX}
            placeholder={defaultPublicMonitorName(row)}
            onChange={(e) => onPublicNameChange(e.target.value)}
            className='hover:bg-muted/50 focus-visible:bg-background dark:focus-visible:bg-input/30 h-7 w-full truncate border-transparent bg-transparent px-2 pr-8 text-sm font-medium shadow-none transition-colors dark:bg-transparent'
          />
          <Pencil className='text-muted-foreground/40 pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 transition-opacity group-focus-within/name:opacity-0' />
        </div>
        <div className='text-muted-foreground truncate text-xs'>{row.url}</div>
      </div>
    </div>
  );
}
