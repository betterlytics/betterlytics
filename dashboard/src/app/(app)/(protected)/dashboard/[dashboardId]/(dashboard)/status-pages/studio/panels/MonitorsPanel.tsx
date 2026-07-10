'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SortableList } from '@/components/dnd/SortableList';
import { formatPercentage } from '@/utils/formatters';
import { monitorRowLabel } from '@/entities/analytics/statusPage/statusPage.helpers';
import { presentMonitorStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { SortableNameRow } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/SortableNameRow';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';

type MonitorsPanelProps = {
  form: StatusPageFormState;
  onCreateMonitor: () => void;
};

export function MonitorsPanel({ form, onCreateMonitor }: MonitorsPanelProps) {
  const t = useTranslations('statusPagesPage.editor');
  const tStatus = useTranslations('monitoring.status');
  const tMonitorForm = useTranslations('monitoringPage.form');
  const locale = useLocale();

  const [search, setSearch] = useState('');
  const { caps } = useCapabilities();
  const atMonitorLimit = form.monitorRows.length >= caps.monitoring.maxMonitors;
  const allSelected = form.monitorRows.length > 0 && form.monitorRows.every((row) => row.included);
  const toggleAll = (checked: boolean) =>
    form.setMonitorRows((rows) => rows.map((row) => ({ ...row, included: checked })));

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      normalizedSearch
        ? form.monitorRows.filter(
            (row) =>
              (row.name ?? '').toLowerCase().includes(normalizedSearch) ||
              row.url.toLowerCase().includes(normalizedSearch),
          )
        : form.monitorRows,
    [form.monitorRows, normalizedSearch],
  );

  const { includedRows, excludedRows, indexByCheckId } = useMemo(
    () => ({
      includedRows: form.monitorRows.filter((row) => row.included),
      excludedRows: form.monitorRows.filter((row) => !row.included),
      indexByCheckId: new Map(form.monitorRows.map((row, index) => [row.monitorCheckId, index])),
    }),
    [form.monitorRows],
  );

  if (form.monitorRows.length === 0) {
    return (
      <div className='border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-5 py-10 text-center'>
        <span className='bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full'>
          <Search className='h-5 w-5' />
        </span>
        <div className='space-y-1'>
          <p className='text-sm font-semibold'>{t('wizard.noMonitorsTitle')}</p>
          <p className='text-muted-foreground text-sm'>{t('wizard.noMonitors')}</p>
        </div>
        <Button
          size='sm'
          className='mt-1 cursor-pointer'
          disabled={atMonitorLimit}
          title={atMonitorLimit ? tMonitorForm('upgradeToCreate') : undefined}
          onClick={onCreateMonitor}
        >
          <Plus className='mr-1 h-4 w-4' />
          {t('wizard.createMonitor')}
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-9'>
      <div className='space-y-4'>
        <Label>{t('wizard.select.heading')}</Label>
        <div className='flex items-center justify-between gap-3'>
          <div className='relative min-w-0 flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              type='text'
              value={search}
              placeholder={t('wizard.searchMonitors')}
              onChange={(e) => setSearch(e.target.value)}
              className='h-9 pl-9'
            />
          </div>
          <label className='flex flex-none cursor-pointer items-center gap-2'>
            <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(checked === true)} />
            <span className='text-sm font-medium'>{t('wizard.selectAll')}</span>
          </label>
        </div>

        <div className='border-border bg-card overflow-hidden rounded-xl border'>
          {filteredRows.length === 0 ? (
            <div className='text-muted-foreground px-4 py-8 text-center text-sm'>
              {t('wizard.noSearchResults')}
            </div>
          ) : (
            filteredRows.map((row) => {
              const index = indexByCheckId.get(row.monitorCheckId) ?? -1;
              const presentation = row.operationalState ? presentMonitorStatus(row.operationalState) : null;
              return (
                <label
                  key={row.monitorCheckId}
                  className={cn(
                    'border-border/60 hover:bg-muted/40 flex cursor-pointer items-center gap-3 border-t px-3.5 py-2.5 transition first:border-t-0',
                    !row.included && 'opacity-50',
                  )}
                >
                  <Checkbox
                    checked={row.included}
                    onCheckedChange={(checked) => form.updateRow(index, { included: checked === true })}
                    className='flex-none'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium'>{monitorRowLabel(row)}</div>
                    <div className='text-muted-foreground truncate text-xs'>{row.url}</div>
                  </div>
                  <div className='flex flex-none items-center gap-2'>
                    {row.uptimePercent != null && (
                      <span className='text-muted-foreground text-xs font-medium tabular-nums'>
                        {formatPercentage(row.uptimePercent, locale, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                          trimHundred: true,
                        })}
                      </span>
                    )}
                    {presentation && (
                      <span
                        className={cn('h-2.5 w-2.5 rounded-full', presentation.theme.dot)}
                        title={tStatus(presentation.labelKey)}
                        aria-label={tStatus(presentation.labelKey)}
                      />
                    )}
                  </div>
                </label>
              );
            })
          )}
          <div className='border-border/60 bg-muted/60 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t px-3.5 py-2.5 text-xs'>
            <span className={cn('text-muted-foreground', form.includedCount === 0 && 'text-destructive')}>
              {form.includedCount === 0
                ? t('wizard.minMonitors')
                : t('wizard.selectedCount', { selected: form.includedCount, total: form.monitorRows.length })}
            </span>
            <span className='text-muted-foreground'>
              {t('wizard.noMonitorYet')}{' '}
              <button
                type='button'
                onClick={onCreateMonitor}
                disabled={atMonitorLimit}
                title={atMonitorLimit ? tMonitorForm('upgradeToCreate') : undefined}
                className='text-primary font-medium hover:underline enabled:cursor-pointer disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60'
              >
                {t('wizard.createMonitor')}
              </button>
            </span>
          </div>
        </div>
      </div>

      {includedRows.length > 0 && (
        <div className='space-y-2'>
          <Label>{t('wizard.publicNames')}</Label>
          <p className='text-muted-foreground text-xs'>{t('studio.publicNamesHint')}</p>
          <SortableList
            items={includedRows}
            getId={(row) => row.monitorCheckId}
            onReorder={(next) => form.setMonitorRows([...next, ...excludedRows])}
            className='space-y-2'
          >
            {includedRows.map((row) => (
              <SortableNameRow
                key={row.monitorCheckId}
                row={row}
                onPublicNameChange={(publicName) =>
                  form.updateRow(indexByCheckId.get(row.monitorCheckId) ?? -1, { publicName })
                }
              />
            ))}
          </SortableList>
        </div>
      )}
    </div>
  );
}
