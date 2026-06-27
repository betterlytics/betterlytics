'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { formatPercentage } from '@/utils/formatters';
import { monitorRowLabel } from '@/entities/analytics/statusPage/statusPage.helpers';
import { presentMonitorStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';

type SelectStepProps = {
  form: StatusPageFormState;
  onCreateMonitor: () => void;
};

export function SelectStep({ form, onCreateMonitor }: SelectStepProps) {
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
  const filteredRows = normalizedSearch
    ? form.monitorRows.filter(
        (row) =>
          (row.name ?? '').toLowerCase().includes(normalizedSearch) ||
          row.url.toLowerCase().includes(normalizedSearch),
      )
    : form.monitorRows;

  return (
    <div className='space-y-5'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold'>{t('wizard.select.heading')}</h2>
        <p className='text-muted-foreground text-sm'>{t('wizard.select.description')}</p>
      </div>

      {form.monitorRows.length === 0 ? (
        <div className='border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center'>
          <span className='bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full'>
            <Search className='h-5 w-5' />
          </span>
          <div className='space-y-1'>
            <p className='text-sm font-semibold'>{t('wizard.noMonitorsTitle')}</p>
            <p className='text-muted-foreground mx-auto max-w-xs text-sm'>{t('wizard.noMonitors')}</p>
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
      ) : (
        <>
          <div className='flex items-end justify-between gap-3'>
            <div className='relative w-full max-w-[240px]'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                type='text'
                value={search}
                placeholder={t('wizard.searchMonitors')}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>
            <label className='flex flex-none cursor-pointer items-center gap-2'>
              <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(checked === true)} />
              <span className='text-sm font-medium'>{t('wizard.selectAll')}</span>
            </label>
          </div>

          <div className='border-border bg-card overflow-hidden rounded-xl border'>
            {filteredRows.length === 0 ? (
              <div className='text-muted-foreground px-4 py-10 text-center text-sm'>
                {t('wizard.noSearchResults')}
              </div>
            ) : (
              filteredRows.map((row) => {
                const index = form.monitorRows.findIndex((r) => r.monitorCheckId === row.monitorCheckId);
                const presentation = row.operationalState ? presentMonitorStatus(row.operationalState) : null;
                return (
                  <label
                    key={row.monitorCheckId}
                    className={cn(
                      'border-border/60 hover:bg-muted/40 flex cursor-pointer items-center gap-3.5 border-t px-4 py-3 transition first:border-t-0',
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
                    <div className='flex flex-none items-center gap-2.5'>
                      {presentation && (
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                            presentation.theme.badgeBorder,
                            presentation.theme.badgeBg,
                            presentation.theme.text,
                          )}
                        >
                          {tStatus(presentation.labelKey)}
                        </span>
                      )}
                      <span className='text-muted-foreground w-12 text-right text-xs font-medium tabular-nums'>
                        {row.uptimePercent != null
                          ? formatPercentage(row.uptimePercent, locale, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                              trimHundred: true,
                            })
                          : '—'}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
            <div className='border-border/60 bg-muted/60 flex items-center justify-between gap-3 border-t px-4 py-3 text-xs'>
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
                  className='text-primary font-medium hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60 enabled:cursor-pointer'
                >
                  {t('wizard.createMonitor')}
                </button>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
