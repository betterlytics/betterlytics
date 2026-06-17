'use client';

import { useTranslations } from 'next-intl';
import { SortableList } from '@/components/dnd/SortableList';
import { SortableMonitorRow } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/SortableMonitorRow';
import { type StatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';
import { Section } from './Section';

type MonitorsTabProps = {
  form: StatusPageFormState;
};

/** Monitor selection tab: toggle which monitors show, reorder them, set public display names. */
export function MonitorsTab({ form }: MonitorsTabProps) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <Section
      title={t('monitors')}
      description={t('monitorsDescription')}
      aside={
        <span className='text-muted-foreground flex-none text-xs whitespace-nowrap'>
          {t('monitorsHint', { selected: form.includedCount, total: form.monitorRows.length })}
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
