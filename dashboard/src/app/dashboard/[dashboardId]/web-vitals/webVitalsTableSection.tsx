'use client';

import { use, useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import TabbedTable, { type TabDefinition } from '@/components/TabbedTable';
import { DeviceIcon, BrowserIcon, OSIcon, FlagIcon } from '@/components/icons';
import { formatCWV, getCwvStatusColor } from '@/utils/formatters';
import MetricInfo from '@/app/dashboard/[dashboardId]/web-vitals/MetricInfo';
import type { CoreWebVitalName } from '@/entities/webVitals';
import type { fetchCoreWebVitalsByDimensionAction } from '@/app/actions/webVitals';
import * as Flags from 'country-flag-icons/react/3x2';
import { Badge } from '@/components/ui/badge';
import { PERFORMANCE_SCORE_THRESHOLDS } from '@/constants/coreWebVitals';
import InfoTooltip from '@/app/dashboard/[dashboardId]/web-vitals/InfoTooltip';

type Row = Awaited<ReturnType<typeof fetchCoreWebVitalsByDimensionAction>>[number];
type DimRow = Awaited<ReturnType<typeof fetchCoreWebVitalsByDimensionAction>>[number];
type Props = {
  perPagePromise: Promise<Row[]>;
  perDevicePromise: Promise<DimRow[]>;
  perCountryPromise: Promise<DimRow[]>;
  perBrowserPromise: Promise<DimRow[]>;
  perOsPromise: Promise<DimRow[]>;
};
type PercentileKey = 'p50' | 'p75' | 'p90' | 'p99';

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

  const [activePercentile, setActivePercentile] = useState<PercentileKey>('p75');
  const percentileIndex: Record<PercentileKey, number> = { p50: 0, p75: 1, p90: 2, p99: 3 };

  const makeColumns = useCallback(
    (label: string, renderIcon?: (key: string) => React.ReactNode): ColumnDef<Row>[] => {
      const getValue = (row: Row, metric: CoreWebVitalName): number | null => {
        const percentiles = row.current.__percentiles?.[metric];
        return percentiles ? percentiles[percentileIndex[activePercentile]] : (row.current as any)[metric];
      };

      const getOpportunity = (row: Row): number | null => {
        const idx = percentileIndex[activePercentile];
        const arr = row.current.__opportunities as [number, number, number, number] | undefined;
        return arr ? arr[idx] : null;
      };

      const getScore = (row: Row): number | null => {
        const idx = percentileIndex[activePercentile];
        const arr = row.current.__scores as [number, number, number, number] | undefined;
        return arr ? arr[idx] : null;
      };

      const scoreVisual = (score: number): { label: string; className: string } => {
        if (score >= PERFORMANCE_SCORE_THRESHOLDS.greatMin)
          return {
            label: 'Great',
            className:
              'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
          };
        if (score >= PERFORMANCE_SCORE_THRESHOLDS.okayMin)
          return {
            label: 'Okay',
            className:
              'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
          };
        return {
          label: 'Poor',
          className:
            'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
        };
      };

      const valueCell = (metric: CoreWebVitalName) => {
        const Cell = ({ row }: { row: { original: Row } }) => {
          const value = getValue(row.original, metric);
          return (
            <div className='flex flex-col items-start'>
              <span style={{ color: getCwvStatusColor(metric, value) }}>{formatCWV(metric, value)}</span>
            </div>
          );
        };
        Cell.displayName = `CwvValueCell_${metric}`;
        return Cell;
      };

      const headerWithInfo = (metric: CoreWebVitalName) => (
        <div className='inline-flex items-center gap-1.5'>
          <span>{metric}</span>
          <MetricInfo metric={metric} iconClassName='h-3.5 w-3.5' />
        </div>
      );

      const headerWithPerformanceInfo = () => (
        <div className='inline-flex items-center gap-1.5'>
          <span>Performance</span>
          <InfoTooltip
            ariaLabel='About performance score'
            iconClassName='h-3.5 w-3.5'
            content={
              <>
                <p className='text-primary-foreground/90'>
                  Performance score (0–100) based on the following metric weights: LCP 30%, CLS 15%, FCP 15%, TTFB
                  10%, INP 30%.
                </p>
                <div className='bg-primary-foreground/20 h-px' />
                <div className='text-[11px] leading-4'>
                  <div>Great: ≥ {PERFORMANCE_SCORE_THRESHOLDS.greatMin}</div>
                  <div>Okay: ≥ {PERFORMANCE_SCORE_THRESHOLDS.okayMin}</div>
                  <div>Poor: &lt; {PERFORMANCE_SCORE_THRESHOLDS.okayMin}</div>
                </div>
              </>
            }
          />
        </div>
      );

      const headerWithOpportunityInfo = () => (
        <div className='inline-flex items-center gap-1.5'>
          <span>Opportunity</span>
          <InfoTooltip
            ariaLabel='About opportunity'
            iconClassName='h-3.5 w-3.5'
            content={
              <>
                <p className='text-primary-foreground/90'>
                  Traffic-weighted potential improvement: traffic share × (100 − Performance).
                </p>
                <div className='bg-primary-foreground/20 h-px' />
                <div className='text-[11px] leading-4'>
                  <div>Changes with the selected percentile (P50/P75/P90/P99)</div>
                </div>
              </>
            }
          />
        </div>
      );

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
        {
          accessorKey: 'samples',
          header: 'Pageloads',
          cell: ({ row }) => <span className='tabular-nums'>{row.original.current.samples}</span>,
          accessorFn: (r) => r.current.samples,
        },
        {
          accessorKey: 'CLS',
          header: () => headerWithInfo('CLS'),
          cell: valueCell('CLS'),
          accessorFn: (r) => getValue(r, 'CLS'),
        },
        {
          accessorKey: 'LCP',
          header: () => headerWithInfo('LCP'),
          cell: valueCell('LCP'),
          accessorFn: (r) => getValue(r, 'LCP'),
        },
        {
          accessorKey: 'INP',
          header: () => headerWithInfo('INP'),
          cell: valueCell('INP'),
          accessorFn: (r) => getValue(r, 'INP'),
        },
        {
          accessorKey: 'FCP',
          header: () => headerWithInfo('FCP'),
          cell: valueCell('FCP'),
          accessorFn: (r) => getValue(r, 'FCP'),
        },
        {
          accessorKey: 'TTFB',
          header: () => headerWithInfo('TTFB'),
          cell: valueCell('TTFB'),
          accessorFn: (r) => getValue(r, 'TTFB'),
        },
        {
          accessorKey: 'score',
          header: () => headerWithPerformanceInfo(),
          cell: ({ row }) => {
            const v = getScore(row.original);
            if (v == null) return <span className='text-muted-foreground'>—</span>;
            const { label, className } = scoreVisual(v);
            return (
              <Badge className={className}>
                {label}: <span className='tabular-nums'>{v.toFixed(1)}</span>
              </Badge>
            );
          },
          accessorFn: (r) => getScore(r) ?? 0,
        },
        {
          accessorKey: 'opportunity',
          header: () => headerWithOpportunityInfo(),
          cell: ({ row }) => {
            const v = getOpportunity(row.original);
            return <span className='tabular-nums'>{v == null ? '—' : v.toFixed(2)}</span>;
          },
          accessorFn: (r) => getOpportunity(r) ?? 0,
        },
      ];
    },
    [activePercentile, percentileIndex],
  );

  const pageColumns: ColumnDef<Row>[] = useMemo(() => makeColumns('Page'), [makeColumns]);
  const deviceColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns('Device Type', (key) => <DeviceIcon type={key} className='h-4 w-4' />),
    [makeColumns],
  );
  const countryColumns: ColumnDef<Row>[] = useMemo(
    () =>
      makeColumns('Country', (key) => (
        <FlagIcon countryCode={key.toUpperCase() as keyof typeof Flags} countryName={key} />
      )),
    [makeColumns],
  );
  const browserColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns('Browser', (key) => <BrowserIcon name={key} className='h-4 w-4' />),
    [makeColumns],
  );
  const osColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns('Operating System', (key) => <OSIcon name={key} className='h-4 w-4' />),
    [makeColumns],
  );

  const defaultSorting = [{ id: 'LCP', desc: true }];

  const tabs: TabDefinition<Row>[] = useMemo(
    () => [
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
    ],
    [data, devices, countries, browsers, operatingSystems, defaultSorting],
  );

  const headerActions = useMemo(
    () => (
      <div className='grid grid-cols-2 grid-rows-2 gap-1 sm:inline-flex sm:flex-row sm:items-center sm:gap-2'>
        {[
          { key: 'p50' as PercentileKey, label: 'P50', color: 'var(--cwv-p50)' },
          { key: 'p75' as PercentileKey, label: 'P75', color: 'var(--cwv-p75)' },
          { key: 'p90' as PercentileKey, label: 'P90', color: 'var(--cwv-p90)' },
          { key: 'p99' as PercentileKey, label: 'P99', color: 'var(--cwv-p99)' },
        ].map((d) => {
          const isOn = activePercentile === d.key;
          const classes =
            'inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium min-w-[56px] sm:min-w-0 ' +
            (isOn
              ? 'bg-primary/10 border-primary/20 text-popover-foreground'
              : 'bg-muted/30 border-border text-muted-foreground');
          return (
            <button
              key={d.label}
              type='button'
              onClick={() => setActivePercentile(d.key)}
              aria-pressed={isOn}
              aria-label={`Select ${d.label} percentile`}
              className={classes}
            >
              <span
                className={'inline-block h-3 w-3 rounded-sm ' + (isOn ? '' : 'opacity-40')}
                style={{ background: d.color }}
              />
              <span>{d.label}</span>
            </button>
          );
        })}
      </div>
    ),
    [activePercentile],
  );

  return (
    <TabbedTable title='Performance breakdown' tabs={tabs} defaultTab='pages' headerActions={headerActions} />
  );
}
