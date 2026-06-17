'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';

import { DragHandle } from '@/components/dnd/DragHandle';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { STATUS_PAGE_LIMITS, defaultPublicMonitorName, monitorRowLabel } from '@/entities/analytics/statusPage.entities';
import { type MonitorOperationalState } from '@/entities/analytics/monitoring.entities';
import { cn } from '@/lib/utils';

export type MonitorRow = {
  monitorCheckId: string;
  name: string | null;
  url: string;
  included: boolean;
  publicName: string;
  operationalState?: MonitorOperationalState;
  uptimePercent?: number | null;
};

type SortableMonitorRowProps = {
  row: MonitorRow;
  /** Position in the list — drives the hairline divider between rows (none on the first). */
  index: number;
  includedCount: number;
  onToggleIncluded: (included: boolean) => void;
  onPublicNameChange: (publicName: string) => void;
};

export function SortableMonitorRow({
  row,
  index,
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
        'bg-card flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center',
        index > 0 && 'border-border border-t',
        !row.included && 'opacity-55',
        isDragging && 'relative z-10 shadow-lg',
      )}
    >
      <div className='flex min-w-0 items-center gap-3 sm:flex-1'>
        <DragHandle
          ref={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
          label={t('reorderMonitor')}
          className='h-9 w-5 flex-none'
        />
        <Switch
          checked={row.included}
          onCheckedChange={(checked) => onToggleIncluded(checked === true)}
          disabled={!row.included && includedCount >= STATUS_PAGE_LIMITS.MONITORS_MAX}
          aria-label={monitorRowLabel(row)}
          className='flex-none cursor-pointer'
        />
        <div className='min-w-0 flex-1'>
          <div className='truncate text-sm font-medium'>{monitorRowLabel(row)}</div>
          <div className='text-muted-foreground truncate font-mono text-xs'>{row.url}</div>
        </div>
      </div>
      <Input
        value={row.publicName}
        maxLength={STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX}
        placeholder={defaultPublicMonitorName(row)}
        disabled={!row.included}
        onChange={(e) => onPublicNameChange(e.target.value)}
        className='sm:w-56 sm:flex-none'
      />
    </div>
  );
}
