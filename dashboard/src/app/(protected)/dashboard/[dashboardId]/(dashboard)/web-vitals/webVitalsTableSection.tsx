'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import TabbedTable, { type TabDefinition } from '@/components/TabbedTable';
import { DeviceIcon, BrowserIcon, OSIcon, FlagIcon } from '@/components/icons';
import { formatNumber, formatString } from '@/utils/formatters';
import { formatCWV, getCoreWebVitalLabelColor, type PercentileKey } from '@/utils/coreWebVitals';
import MetricInfo from './MetricInfo';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';
import * as Flags from 'country-flag-icons/react/3x2';
import { Badge } from '@/components/ui/badge';
import { PERFORMANCE_SCORE_THRESHOLDS } from '@/constants/coreWebVitals';
import { InfoTooltip } from '@/components/ui-extended/InfoTooltip';
import { useLocale, useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFilterClick } from '@/hooks/use-filter-click';
import type { FilterColumn } from '@/entities/analytics/filter.entities';

import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/trpc/routers/_app';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Row = RouterOutputs['webVitals']['byDimension'][number];

export default function WebVitalsTableSection() {
  const t = useTranslations('components.webVitals.table');
  const tFilters = useTranslations('components.filters');
  const locale = useLocale();
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });
  const [activePercentile, setActivePercentile] = useState<PercentileKey>('p75');
  const [activeTab, setActiveTab] = useState<string>('pages');
  const percentileIndex: Record<PercentileKey, number> = { p50: 0, p75: 1, p90: 2, p99: 3 };
  const { input, options } = useBAQueryParams();

  const urlQuery = trpc.webVitals.byDimension.useQuery(
    { ...input, dimension: 'url' },
    { ...options, enabled: activeTab === 'pages' },
  );
  const devicesQuery = trpc.webVitals.byDimension.useQuery(
    { ...input, dimension: 'device_type' },
    { ...options, enabled: activeTab === 'devices' },
  );
  const countriesQuery = trpc.webVitals.byDimension.useQuery(
    { ...input, dimension: 'country_code' },
    { ...options, enabled: activeTab === 'countries' },
  );
  const browsersQuery = trpc.webVitals.byDimension.useQuery(
    { ...input, dimension: 'browser' },
    { ...options, enabled: activeTab === 'browsers' },
  );
  const osQuery = trpc.webVitals.byDimension.useQuery(
    { ...input, dimension: 'os' },
    { ...options, enabled: activeTab === 'os' },
  );

  const makeColumns = useCallback(
    (
      label: string,
      renderIcon?: (key: string) => React.ReactNode,
      filterColumn?: FilterColumn,
    ): ColumnDef<Row>[] => {
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
            label: t('badges.great'),
            className:
              'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
          };
        if (score >= PERFORMANCE_SCORE_THRESHOLDS.okayMin)
          return {
            label: t('badges.okay'),
            className:
              'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
          };
        return {
          label: t('badges.poor'),
          className:
            'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
        };
      };

      const valueCell = (metric: CoreWebVitalName) => {
        const Cell = ({ row }: { row: { original: Row } }) => {
          const value = getValue(row.original, metric);
          return (
            <span style={{ color: getCoreWebVitalLabelColor(metric, value) }}>
              {formatCWV(metric, value, locale)}
            </span>
          );
        };
        Cell.displayName = `CoreWebVitalValueCell_${metric}`;
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
          <span>{t('performance')}</span>
          <InfoTooltip ariaLabel={t('performanceAria')} iconClassName='h-3.5 w-3.5'>
            <InfoTooltip.Description>{t('performanceDescr')}</InfoTooltip.Description>
            <InfoTooltip.Secondary>
              <div>{t('performanceGreat', { min: PERFORMANCE_SCORE_THRESHOLDS.greatMin })}</div>
              <div>{t('performanceOkay', { min: PERFORMANCE_SCORE_THRESHOLDS.okayMin })}</div>
              <div>{t('performancePoor', { min: PERFORMANCE_SCORE_THRESHOLDS.okayMin })}</div>
            </InfoTooltip.Secondary>
          </InfoTooltip>
        </div>
      );

      const headerWithOpportunityInfo = () => (
        <div className='inline-flex items-center gap-1.5'>
          <span>{t('opportunity')}</span>
          <InfoTooltip ariaLabel={t('opportunityAria')} iconClassName='h-3.5 w-3.5'>
            <InfoTooltip.Description>{t('opportunityDescr')}</InfoTooltip.Description>
            <InfoTooltip.Secondary>
              <div>{t('opportunityNote')}</div>
            </InfoTooltip.Secondary>
          </InfoTooltip>
        </div>
      );

      return [
        {
          accessorKey: 'key',
          header: label,
          minSize: 200,
          cell: ({ row }) => {
            const key = row.original.key;
            const labelText = formatString(key);
            return (
              <Button
                variant='ghost'
                onClick={filterColumn ? () => makeFilterClick(filterColumn)(key) : undefined}
                className='cursor-pointer bg-transparent p-0 text-left text-sm font-medium'
                title={tFilters('filterBy', { label: labelText })}
              >
                <span className='flex max-w-[480px] items-center gap-2 truncate'>
                  {renderIcon && <span className='shrink-0'>{renderIcon(key)}</span>}
                  <span className='truncate'>{labelText}</span>
                </span>
              </Button>
            );
          },
        },
        {
          accessorKey: 'samples',
          header: t('pageloads'),
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
                {label}:{' '}
                <span className='tabular-nums'>
                  {formatNumber(v, locale, {
                    notation: 'standard',
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
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
            return (
              <span className='tabular-nums'>
                {v == null
                  ? '—'
                  : formatNumber(v, locale, {
                      notation: 'standard',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </span>
            );
          },
          accessorFn: (r) => getOpportunity(r) ?? 0,
        },
      ];
    },
    [activePercentile, percentileIndex, makeFilterClick, tFilters],
  );

  const pageColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns(t('tabs.page'), undefined, 'url'),
    [makeColumns, t],
  );
  const deviceColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns(t('tabs.deviceType'), (key) => <DeviceIcon type={key} className='h-4 w-4' />, 'device_type'),
    [makeColumns, t],
  );
  const countryColumns: ColumnDef<Row>[] = useMemo(
    () =>
      makeColumns(
        t('tabs.country'),
        (key) => <FlagIcon countryCode={key.toUpperCase() as keyof typeof Flags} countryName={key} />,
        'country_code',
      ),
    [makeColumns, t],
  );
  const browserColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns(t('tabs.browser'), (key) => <BrowserIcon name={key} className='h-4 w-4' />, 'browser'),
    [makeColumns, t],
  );
  const osColumns: ColumnDef<Row>[] = useMemo(
    () => makeColumns(t('tabs.operatingSystem'), (key) => <OSIcon name={key} className='h-4 w-4' />, 'os'),
    [makeColumns, t],
  );

  const defaultSorting = useMemo(() => [{ id: 'LCP', desc: true }], []);

  const urlState = useQueryState(urlQuery, activeTab === 'pages');
  const devicesState = useQueryState(devicesQuery, activeTab === 'devices');
  const countriesState = useQueryState(countriesQuery, activeTab === 'countries');
  const browsersState = useQueryState(browsersQuery, activeTab === 'browsers');
  const osState = useQueryState(osQuery, activeTab === 'os');

  const activeState = { pages: urlState, devices: devicesState, countries: countriesState, browsers: browsersState, os: osState }[
    activeTab as 'pages' | 'devices' | 'countries' | 'browsers' | 'os'
  ];

  const tabs: TabDefinition<Row>[] = useMemo(
    () => [
      {
        key: 'pages',
        label: t('tabs.pages'),
        data: urlQuery.data ?? [],
        columns: pageColumns,
        defaultSorting,
        loading: urlState.loading,
      },
      {
        key: 'devices',
        label: t('tabs.devices'),
        data: devicesQuery.data ?? [],
        columns: deviceColumns,
        defaultSorting,
        loading: devicesState.loading,
      },
      {
        key: 'countries',
        label: t('tabs.countries'),
        data: countriesQuery.data ?? [],
        columns: countryColumns,
        defaultSorting,
        loading: countriesState.loading,
      },
      {
        key: 'browsers',
        label: t('tabs.browsers'),
        data: browsersQuery.data ?? [],
        columns: browserColumns,
        defaultSorting,
        loading: browsersState.loading,
      },
      {
        key: 'os',
        label: t('tabs.operatingSystems'),
        data: osQuery.data ?? [],
        columns: osColumns,
        defaultSorting,
        loading: osState.loading,
      },
    ],
    [
      urlQuery.data,
      devicesQuery.data,
      countriesQuery.data,
      browsersQuery.data,
      osQuery.data,
      urlState.loading,
      devicesState.loading,
      countriesState.loading,
      browsersState.loading,
      osState.loading,
      pageColumns,
      deviceColumns,
      countryColumns,
      browserColumns,
      osColumns,
      defaultSorting,
      t,
    ],
  );

  const percentileButtons = useMemo(
    () => (
      <div className='inline-grid grid-cols-2 gap-2 sm:inline-flex sm:flex-row sm:items-center sm:gap-2'>
        {[
          { key: 'p50' as PercentileKey, label: 'P50', color: 'var(--cwv-p50)' },
          { key: 'p75' as PercentileKey, label: 'P75', color: 'var(--cwv-p75)' },
          { key: 'p90' as PercentileKey, label: 'P90', color: 'var(--cwv-p90)' },
          { key: 'p99' as PercentileKey, label: 'P99', color: 'var(--cwv-p99)' },
        ].map((d) => {
          const isOn = activePercentile === d.key;
          const classes =
            'inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium sm:w-auto ' +
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

  const headerActions = useMemo(
    () => <div className='hidden sm:block'>{percentileButtons}</div>,
    [percentileButtons],
  );

  const mobileTabsRowLeft = useMemo(
    () => (
      <div className='flex w-full items-center gap-2'>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className='min-w-[180px] cursor-pointer'>
            <SelectValue placeholder='Select tab' />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.key} value={tab.key} className='cursor-pointer'>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='ml-auto shrink-0'>{percentileButtons}</div>
      </div>
    ),
    [activeTab, tabs, percentileButtons],
  );

  return (
    <TabbedTable
      title={t('title')}
      loading={activeState.refetching}
      tabs={tabs}
      defaultTab='pages'
      tabValue={activeTab}
      onTabValueChange={setActiveTab}
      headerActions={headerActions}
      tabsRowLeftMobile={mobileTabsRowLeft}
      hideTabsListOnMobile
    />
  );
}
