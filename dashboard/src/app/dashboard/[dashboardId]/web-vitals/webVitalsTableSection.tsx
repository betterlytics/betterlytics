'use client';

import { use, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import TabbedTable, { type TabDefinition } from '@/components/TabbedTable';
import { DeviceIcon, BrowserIcon, OSIcon, FlagIcon } from '@/components/icons';
import { formatCWV, getCwvStatusColor } from '@/utils/formatters';
import type { CoreWebVitalName } from '@/entities/webVitals';
import type { fetchCoreWebVitalsByDimensionAction } from '@/app/actions/webVitals';

type Row = Awaited<ReturnType<typeof fetchCoreWebVitalsByDimensionAction>>[number];
type DimRow = Awaited<ReturnType<typeof fetchCoreWebVitalsByDimensionAction>>[number];
type Props = {
  perPagePromise: Promise<Row[]>;
  perDevicePromise: Promise<DimRow[]>;
  perCountryPromise: Promise<DimRow[]>;
  perBrowserPromise: Promise<DimRow[]>;
  perOsPromise: Promise<DimRow[]>;
};

export default function WebVitalsTableSection({
  perPagePromise,
  perDevicePromise,
  perCountryPromise,
  perBrowserPromise,
  perOsPromise,
}: Props) {
  const data = use(perPagePromise);
  const devices = use(perDevicePromise);
  const countries = use(perCountryPromise);
  const browsers = use(perBrowserPromise);
  const operatingSystems = use(perOsPromise);
  type PercentileKey = 'p50' | 'p75' | 'p90' | 'p99';
  const [activePercentile, setActivePercentile] = useState<PercentileKey>('p75');
  const percentileIndex: Record<PercentileKey, number> = { p50: 0, p75: 1, p90: 2, p99: 3 };

  const makeColumns = (label: string, renderIcon?: (key: string) => React.ReactNode): ColumnDef<Row>[] => {
    const getValue = (row: Row, metric: CoreWebVitalName): number | null => {
      const percentiles = row.current.__percentiles?.[metric];
      return percentiles ? percentiles[percentileIndex[activePercentile]] : (row.current as any)[metric];
    };

    const valueCell =
      (metric: CoreWebVitalName) =>
      ({ row }: { row: { original: Row } }) => {
        const value = getValue(row.original, metric);
        return (
          <div className='flex flex-col items-start'>
            <span style={{ color: getCwvStatusColor(metric, value) }}>{formatCWV(metric, value)}</span>
          </div>
        );
      };

    return [
      {
        accessorKey: 'key',
        header: label,
        cell: ({ row }) => (
          <div className='flex max-w-[480px] items-center gap-2 truncate'>
            {renderIcon && <span className='shrink-0'>{renderIcon(row.original.key)}</span>}
            <span className='truncate'>{row.original.key}</span>
          </div>
        ),
      },
      { accessorKey: 'CLS', header: 'CLS', cell: valueCell('CLS'), accessorFn: (r) => getValue(r, 'CLS') },
      { accessorKey: 'LCP', header: 'LCP', cell: valueCell('LCP'), accessorFn: (r) => getValue(r, 'LCP') },
      { accessorKey: 'INP', header: 'INP', cell: valueCell('INP'), accessorFn: (r) => getValue(r, 'INP') },
      { accessorKey: 'FCP', header: 'FCP', cell: valueCell('FCP'), accessorFn: (r) => getValue(r, 'FCP') },
      {
        accessorKey: 'TTFB',
        header: 'TTFB',
        cell: valueCell('TTFB'),
        accessorFn: (r) => getValue(r, 'TTFB'),
      },
      {
        accessorKey: 'samples',
        header: 'Events',
        cell: ({ row }) => <span className='tabular-nums'>{row.original.current.samples}</span>,
        accessorFn: (r) => r.current.samples,
      },
    ];
  };

  const pageColumns: ColumnDef<Row>[] = useMemo(() => makeColumns('Page'), [activePercentile]);
  const deviceColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns('Device Type', (key) => <DeviceIcon type={key} className='h-4 w-4' />),
    [activePercentile],
  );
  const countryColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns('Country', (key) => <FlagIcon countryCode={(key || 'US').toUpperCase() as any} />),
    [activePercentile],
  );
  const browserColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns('Browser', (key) => <BrowserIcon name={key} className='h-4 w-4' />),
    [activePercentile],
  );
  const osColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns('Operating System', (key) => <OSIcon name={key} className='h-4 w-4' />),
    [activePercentile],
  );

  const defaultSorting = [{ id: 'LCP', desc: true }];

  const tabs: TabDefinition<Row>[] = [
    { key: 'pages', label: 'Pages', data, columns: pageColumns, defaultSorting },
    {
      key: 'devices',
      label: 'Devices',
      data: devices,
      columns: deviceColumns,
      defaultSorting,
    },
    {
      key: 'countries',
      label: 'Countries',
      data: countries,
      columns: countryColumns,
      defaultSorting,
    },
    {
      key: 'browsers',
      label: 'Browsers',
      data: browsers,
      columns: browserColumns,
      defaultSorting,
    },
    {
      key: 'os',
      label: 'Operating Systems',
      data: operatingSystems,
      columns: osColumns,
      defaultSorting,
    },
  ];

  const headerActions = (
    <div className='flex items-center gap-2'>
      {[
        { key: 'p50' as PercentileKey, label: 'P50', color: 'var(--cwv-p50)' },
        { key: 'p75' as PercentileKey, label: 'P75', color: 'var(--cwv-p75)' },
        { key: 'p90' as PercentileKey, label: 'P90', color: 'var(--cwv-p90)' },
        { key: 'p99' as PercentileKey, label: 'P99', color: 'var(--cwv-p99)' },
      ].map((d) => {
        const isOn = activePercentile === d.key;
        const classes =
          'inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium ' +
          (isOn
            ? 'bg-primary/10 border-primary/20 text-popover-foreground'
            : 'bg-muted/30 border-border text-muted-foreground');
        return (
          <button
            key={d.label}
            type='button'
            onClick={() => setActivePercentile(d.key)}
            aria-pressed={isOn}
            className={classes}
          >
            <span className={'h-3 w-3 rounded-sm ' + (isOn ? '' : 'opacity-40')} style={{ background: d.color }} />
            <span>{d.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <TabbedTable title='Performance breakdown' tabs={tabs} defaultTab='pages' headerActions={headerActions} />
  );
}
