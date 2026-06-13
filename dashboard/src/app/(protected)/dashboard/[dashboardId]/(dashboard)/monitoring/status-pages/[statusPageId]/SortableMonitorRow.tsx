'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';

import { DragHandle } from '@/components/dnd/DragHandle';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage.entities';
import { cn } from '@/lib/utils';

export type MonitorRow = {
  monitorCheckId: string;
  name: string | null;
  url: string;
  included: boolean;
  publicName: string;
};

type SortableMonitorRowProps = {
  row: MonitorRow;
  includedCount: number;
  onToggleIncluded: (included: boolean) => void;
  onPublicNameChange: (publicName: string) => void;
};

export function SortableMonitorRow({
  row,
  includedCount,
  onToggleIncluded,
  onPublicNameChange,
}: SortableMonitorRowProps) {
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
        !row.included && 'opacity-55',
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
      <Checkbox
        checked={row.included}
        onCheckedChange={(checked) => onToggleIncluded(checked === true)}
        disabled={!row.included && includedCount >= STATUS_PAGE_LIMITS.MONITORS_MAX}
        className='flex-none cursor-pointer'
      />
      <div className='min-w-0 flex-1'>
        <div className='truncate text-sm font-medium'>{row.name ?? row.url}</div>
        <div className='text-muted-foreground truncate text-xs'>{row.url}</div>
      </div>
      <Input
        value={row.publicName}
        maxLength={STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX}
        placeholder={t('publicNamePlaceholder')}
        disabled={!row.included}
        onChange={(e) => onPublicNameChange(e.target.value)}
        className='sm:w-56'
      />
    </div>
  );
}
