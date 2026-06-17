'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SortableList } from '@/components/dnd/SortableList';
import { SortableMonitorRow } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/SortableMonitorRow';
import { type StatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';
import { Section } from './Section';

type MonitorsTabProps = {
  form: StatusPageFormState;
};

export function MonitorsTab({ form }: MonitorsTabProps) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <Section
      title={t('monitors')}
      description={t('monitorsDescription')}
      aside={
        <span
          className={cn(
            'flex-none text-xs whitespace-nowrap',
            form.includedCount === 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {form.includedCount === 0
            ? t('minMonitorsHint')
            : t('monitorsHint', { selected: form.includedCount, total: form.monitorRows.length })}
        </span>
      }
    >
      <SortableList
        items={form.monitorRows}
        getId={(row) => row.monitorCheckId}
        onReorder={(next) => form.setMonitorRows(next)}
        className='bg-card border-border overflow-hidden rounded-xl border'
      >
        {form.monitorRows.map((row, index) => (
          <SortableMonitorRow
            key={row.monitorCheckId}
            row={row}
            index={index}
            includedCount={form.includedCount}
            onToggleIncluded={(included) => form.updateRow(index, { included })}
            onPublicNameChange={(publicName) => form.updateRow(index, { publicName })}
          />
        ))}
      </SortableList>
    </Section>
  );
}
