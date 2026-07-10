'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type MonitorOption = { monitorCheckId: string; publicName: string };

type AffectedMonitorsPickerProps = {
  monitors: MonitorOption[];
  value: string[];
  onChange: (ids: string[]) => void;
};

export function AffectedMonitorsPicker({ monitors, value, onChange }: AffectedMonitorsPickerProps) {
  const t = useTranslations('statusPagesPage.editor.incidents.form');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const nameById = useMemo(() => new Map(monitors.map((m) => [m.monitorCheckId, m.publicName])), [monitors]);

  const total = monitors.length;
  const selectedCount = value.length;
  const unspecified = selectedCount === 0;
  const allSelected = total > 0 && selectedCount === total;

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const selectAll = () => onChange(monitors.map((m) => m.monitorCheckId));
  const clear = () => onChange([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? monitors.filter((m) => m.publicName.toLowerCase().includes(q)) : monitors;
  }, [monitors, query]);

  const tokens = allSelected
    ? [{ id: '__all__', label: t('monitorAllToken'), remove: clear }]
    : value.map((id) => ({
        id,
        label: nameById.get(id) ?? id,
        remove: () => onChange(value.filter((x) => x !== id)),
      }));

  return (
    <div className='space-y-2'>
      {/* modal: without it, the parent Sheet's scroll lock swallows wheel events over the portaled popover. */}
      <Popover
        modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery('');
        }}
      >
        <PopoverTrigger asChild>
          <button
            type='button'
            className='border-input dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]'
          >
            {unspecified ? (
              <span className='text-muted-foreground'>{t('monitorNotSpecified')}</span>
            ) : (
              tokens.map((token) => (
                <span
                  key={token.id}
                  className='bg-secondary border-border text-foreground inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-1 pl-2.5 text-xs'
                >
                  {token.label}
                  <span
                    role='button'
                    tabIndex={-1}
                    aria-label={t('monitorRemove', { monitor: token.label })}
                    onClick={(e) => {
                      e.stopPropagation();
                      token.remove();
                    }}
                    className='text-muted-foreground hover:bg-accent hover:text-foreground inline-flex h-4 w-4 items-center justify-center rounded-full'
                  >
                    <X className='h-2.5 w-2.5' strokeWidth={2.5} />
                  </span>
                </span>
              ))
            )}
            <ChevronDown
              className={cn(
                'text-muted-foreground ml-auto h-4 w-4 shrink-0 transition-transform',
                open && 'rotate-180',
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-[var(--radix-popover-trigger-width)] p-1.5'>
          <div className='text-muted-foreground flex items-center gap-2 px-2 py-1'>
            <Search className='h-3.5 w-3.5 shrink-0' />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('monitorSearchPlaceholder')}
              className='text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none'
            />
          </div>
          <div className='bg-border my-1 h-px' />
          <div className='flex items-center justify-between px-2 pt-0.5 pb-1.5'>
            <span className='text-muted-foreground text-[11px]'>
              {t('monitorCountSelected', { selected: selectedCount, total })}
            </span>
            <div className='flex gap-3.5 text-xs'>
              <button
                type='button'
                onClick={selectAll}
                disabled={allSelected || total === 0}
                className='text-primary cursor-pointer disabled:cursor-default disabled:opacity-40'
              >
                {t('monitorSelectAll')}
              </button>
              <button
                type='button'
                onClick={clear}
                disabled={unspecified}
                className='text-muted-foreground hover:text-foreground cursor-pointer disabled:cursor-default disabled:opacity-40'
              >
                {t('monitorClear')}
              </button>
            </div>
          </div>
          <div className='max-h-56 overflow-y-auto'>
            {filtered.length === 0 ? (
              <p className='text-muted-foreground px-2 py-4 text-center text-xs'>{t('monitorNoMatch')}</p>
            ) : (
              filtered.map((monitor) => {
                const on = value.includes(monitor.monitorCheckId);
                return (
                  <button
                    key={monitor.monitorCheckId}
                    type='button'
                    onClick={() => toggle(monitor.monitorCheckId)}
                    className='hover:bg-accent flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm'
                  >
                    <span
                      className={cn(
                        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border',
                        on ? 'bg-primary border-primary text-primary-foreground' : 'border-input',
                      )}
                    >
                      {on && <Check className='h-3 w-3' strokeWidth={3.5} />}
                    </span>
                    <span className='truncate'>{monitor.publicName}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {!unspecified && (
        <div className='text-muted-foreground text-xs'>
          {allSelected
            ? t('monitorSummaryPageWide', { count: total })
            : t('monitorSummaryScoped', { count: selectedCount, total })}
        </div>
      )}
    </div>
  );
}
