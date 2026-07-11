'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SortableList } from '@/components/dnd/SortableList';
import { monitorRowLabel } from '@/entities/analytics/statusPage/statusPage.helpers';
import { operationalStateToTone } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { MonitorStatusMeta } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/MonitorStatusMeta';
import { SortableNameRow } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/SortableNameRow';
import { type MonitorRow } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/monitorRow';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';

type MonitorsPanelProps = {
  form: StatusPageFormState;
  onCreateMonitor: () => void;
};

export function MonitorsPanel({ form, onCreateMonitor }: MonitorsPanelProps) {
  const t = useTranslations('statusPagesPage.editor');
  const tMonitorForm = useTranslations('monitoringPage.form');

  const { caps } = useCapabilities();
  const atMonitorLimit = form.monitorRows.length >= caps.monitoring.maxMonitors;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const { includedRows, availableRows } = useMemo(
    () => ({
      includedRows: form.monitorRows.filter((row) => row.included),
      availableRows: form.monitorRows.filter((row) => !row.included),
    }),
    [form.monitorRows],
  );

  const patchRow = (monitorCheckId: string, patch: Partial<MonitorRow>) =>
    form.setMonitorRows((rows) =>
      rows.map((row) => (row.monitorCheckId === monitorCheckId ? { ...row, ...patch } : row)),
    );

  // Moving the row to the end of the array appends it last on the public page.
  const addRow = (monitorCheckId: string) => {
    form.setMonitorRows((rows) => {
      const row = rows.find((r) => r.monitorCheckId === monitorCheckId);
      return row ? [...rows.filter((r) => r.monitorCheckId !== monitorCheckId), { ...row, included: true }] : rows;
    });
    setLastAddedId(monitorCheckId);
  };

  const addAll = () =>
    form.setMonitorRows((rows) => [
      ...rows.filter((row) => row.included),
      ...rows.filter((row) => !row.included).map((row) => ({ ...row, included: true })),
    ]);

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
    <div className='flex h-full flex-col gap-4'>
      <div className='flex-none space-y-1'>
        <div className='flex items-baseline justify-between gap-3'>
          <Label>{t('wizard.monitorsHeading')}</Label>
          <span className='text-muted-foreground text-xs whitespace-nowrap tabular-nums'>
            {t('wizard.shownCount', { selected: includedRows.length, total: form.monitorRows.length })}
          </span>
        </div>
        <p className='text-muted-foreground text-xs'>{t('studio.publicNamesHint')}</p>
      </div>

      {includedRows.length === 0 ? (
        <button
          type='button'
          onClick={() => setPickerOpen(true)}
          className='border-border hover:border-muted-foreground hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/50 flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed px-5 py-10 text-center transition-colors outline-none focus-visible:ring-[3px]'
        >
          <span className='bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full'>
            <Plus className='h-5 w-5' />
          </span>
          <span className='space-y-1'>
            <span className='block text-sm font-semibold'>{t('wizard.emptyPageTitle')}</span>
            <span className='text-muted-foreground block text-sm'>{t('wizard.emptyPageHint')}</span>
          </span>
        </button>
      ) : (
        <SortableList
          items={includedRows}
          getId={(row) => row.monitorCheckId}
          onReorder={(next) => form.setMonitorRows([...next, ...availableRows])}
          className='-mr-2 min-h-0 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] space-y-2 overflow-y-auto pr-2'
        >
          {includedRows.map((row) => (
            <SortableNameRow
              key={row.monitorCheckId}
              row={row}
              justAdded={row.monitorCheckId === lastAddedId}
              onPublicNameChange={(publicName) => patchRow(row.monitorCheckId, { publicName })}
              onRemove={() => patchRow(row.monitorCheckId, { included: false })}
            />
          ))}
        </SortableList>
      )}

      <div className='flex-none'>
        <AddMonitorPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          availableRows={availableRows}
          onAdd={addRow}
          onAddAll={addAll}
          onCreateMonitor={onCreateMonitor}
          atMonitorLimit={atMonitorLimit}
        />
      </div>

      {includedRows.length === 0 && (
        <p className='text-destructive flex-none text-xs'>{t('wizard.minMonitors')}</p>
      )}
    </div>
  );
}

type AddMonitorPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableRows: MonitorRow[];
  onAdd: (monitorCheckId: string) => void;
  onAddAll: () => void;
  onCreateMonitor: () => void;
  atMonitorLimit: boolean;
};

function AddMonitorPicker({
  open,
  onOpenChange,
  availableRows,
  onAdd,
  onAddAll,
  onCreateMonitor,
  atMonitorLimit,
}: AddMonitorPickerProps) {
  const t = useTranslations('statusPagesPage.editor');
  const tMonitorForm = useTranslations('monitoringPage.form');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const options = useMemo(
    () =>
      normalizedQuery
        ? availableRows.filter(
            (row) =>
              (row.name ?? '').toLowerCase().includes(normalizedQuery) ||
              row.url.toLowerCase().includes(normalizedQuery),
          )
        : availableRows,
    [availableRows, normalizedQuery],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <div
      ref={containerRef}
      className='space-y-2'
      onKeyDown={(e) => {
        if (e.key === 'Escape') onOpenChange(false);
      }}
    >
      <Button
        type='button'
        variant='outline'
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className='text-muted-foreground hover:text-foreground hover:bg-muted/40 dark:hover:bg-muted/40 h-9 w-full cursor-pointer border-dashed bg-transparent shadow-none dark:bg-transparent'
      >
        <Plus className='h-4 w-4' />
        {t('wizard.addMonitor')}
      </Button>
      {open && (
        <div className='border-border bg-card animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-lg border shadow-sm duration-150'>
          <div className='border-border relative border-b'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('wizard.searchMonitors')}
              className='placeholder:text-muted-foreground h-9 w-full bg-transparent pr-3 pl-9 text-sm outline-none'
            />
          </div>
          <div className='max-h-60 overflow-y-auto p-1'>
            {options.length === 0 ? (
              <p className='text-muted-foreground px-3 py-5 text-center text-sm'>
                {t(normalizedQuery ? 'wizard.noSearchResults' : 'wizard.allOnPage')}
              </p>
            ) : (
              options.map((row) => {
                const isMuted =
                  row.operationalState != null && operationalStateToTone(row.operationalState) === 'neutral';
                return (
                  <button
                    key={row.monitorCheckId}
                    type='button'
                    onClick={() => {
                      onAdd(row.monitorCheckId);
                      // Stays open for multi-add; closes once the last one is added.
                      if (availableRows.length === 1) onOpenChange(false);
                    }}
                    className='hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left'
                  >
                    <div className='min-w-0 flex-1'>
                      <div className={cn('truncate text-sm font-medium', isMuted && 'text-muted-foreground')}>
                        {monitorRowLabel(row)}
                      </div>
                      <div className='text-muted-foreground truncate text-xs'>{row.url}</div>
                    </div>
                    <MonitorStatusMeta row={row} />
                  </button>
                );
              })
            )}
          </div>
          <div className='border-border bg-muted/40 text-muted-foreground flex items-center justify-between gap-3 border-t px-3 py-2 text-xs'>
            {availableRows.length >= 2 ? (
              <button
                type='button'
                onClick={() => {
                  onAddAll();
                  onOpenChange(false);
                }}
                className='hover:text-foreground cursor-pointer font-medium whitespace-nowrap'
              >
                {t('wizard.addAll', { count: availableRows.length })}
              </button>
            ) : (
              <span />
            )}
            <span>
              {t('wizard.noMonitorYet')}{' '}
              <button
                type='button'
                onClick={() => {
                  onOpenChange(false);
                  onCreateMonitor();
                }}
                disabled={atMonitorLimit}
                title={atMonitorLimit ? tMonitorForm('upgradeToCreate') : undefined}
                className='text-primary font-medium hover:underline enabled:cursor-pointer disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60'
              >
                {t('wizard.createMonitor')}
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
