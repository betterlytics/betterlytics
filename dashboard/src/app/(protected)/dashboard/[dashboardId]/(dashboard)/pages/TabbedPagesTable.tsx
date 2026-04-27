'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useCallback } from 'react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { Button } from '@/components/ui/button';
import { formatNumber, formatPercentage, formatString } from '@/utils/formatters';
import TabbedTable from '@/components/TabbedTable';
import type { AppRouter } from '@/trpc/routers/_app';
import type { inferRouterOutputs } from '@trpc/server';
import { TableCompareCell } from '@/components/TableCompareCell';
import { TableTrendIndicator } from '@/components/TableTrendIndicator';
import { formatDuration } from '@/utils/dateFormatters';
import { useLocale, useTranslations } from 'next-intl';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type PageAnalyticsData = RouterOutputs['pages']['pageAnalytics'];

interface TabbedPagesTableProps {
  allPagesData: PageAnalyticsData;
  entryPagesData: PageAnalyticsData;
  exitPagesData: PageAnalyticsData;
  allPagesLoading?: boolean;
  entryPagesLoading?: boolean;
  exitPagesLoading?: boolean;
  loading?: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const formatPath = (path: string): string => {
  return path || '/';
};

export default function TabbedPagesTable({
  allPagesData,
  entryPagesData,
  exitPagesData,
  allPagesLoading,
  entryPagesLoading,
  exitPagesLoading,
  loading,
  activeTab,
  onTabChange,
}: TabbedPagesTableProps) {
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });
  const locale = useLocale();
  const t = useTranslations('components.pages.table');

  const getBaseColumns = useCallback((): ColumnDef<
    PageAnalyticsData[number]
  >[] => {
    return [
      {
        accessorKey: 'path',
        header: t('path'),
        minSize: 200,
        cell: ({ row }) => {
          const path = formatPath(row.original.path);
          return (
            <Button
              variant='ghost'
              onClick={() => makeFilterClick('url')(path)}
              className='cursor-pointer bg-transparent p-0 text-left text-sm font-medium transition-colors'
              title={t('filterByPath', { path })}
            >
              {formatString(path)}
            </Button>
          );
        },
      },
      {
        accessorKey: 'visitors',
        header: t('visitors'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='visitors' formatter={formatNumber} />,
        accessorFn: (row) => row.current.visitors,
      },
      {
        accessorKey: 'pageviews',
        header: t('pageviews'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='pageviews' formatter={formatNumber} />,
        accessorFn: (row) => row.current.pageviews,
      },
      {
        accessorKey: 'bounceRate',
        header: t('bounceRate'),
        cell: ({ row }) => (
          <TableCompareCell row={row.original} dataKey='bounceRate' formatter={formatPercentage} allowNullish />
        ),
        accessorFn: (row) => row.current.bounceRate,
      },
      {
        accessorKey: 'avgTime',
        header: t('avgTime'),
        cell: ({ row }) => (
          <TableCompareCell row={row.original} dataKey='avgTime' formatter={formatDuration} allowNullish />
        ),
        accessorFn: (row) => row.current.avgTime,
      },
      {
        accessorKey: 'avgScrollDepth',
        header: t('avgScrollDepth'),
        cell: ({ row }) => (
          <TableCompareCell
            row={row.original}
            dataKey='avgScrollDepth'
            formatter={formatPercentage}
            allowNullish
          />
        ),
        accessorFn: (row) => row.current.avgScrollDepth,
      },
    ];
  }, [makeFilterClick, locale, t]);

  const getTabSpecificColumns = useCallback((): Record<
    string,
    ColumnDef<PageAnalyticsData[number]>
  > => {
    return {
      entryRate: {
        accessorKey: 'entryRate',
        header: t('entryRate'),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <div>{formatPercentage(row.original.current.entryRate ?? 0, locale)}</div>
            <TableTrendIndicator
              current={row.original.current.entryRate ?? 0}
              compare={row.original.compare?.entryRate}
              percentage={row.original.change?.entryRate}
              formatter={formatPercentage}
            />
          </div>
        ),
        accessorFn: (row) => row.current.entryRate,
      },
      exitRate: {
        accessorKey: 'exitRate',
        header: t('exitRate'),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <div>{formatPercentage(row.original.current.exitRate ?? 0, locale)}</div>
            <TableTrendIndicator
              current={row.original.current.exitRate ?? 0}
              compare={row.original.compare?.exitRate}
              percentage={row.original.change?.exitRate}
              formatter={formatPercentage}
            />
          </div>
        ),
        accessorFn: (row) => row.current.exitRate,
      },
    };
  }, [t, locale]);

  const allPagesColumns = useMemo(() => getBaseColumns(), [getBaseColumns]);

  const entryPagesColumns = useMemo(() => {
    const base = getBaseColumns();
    const specific = getTabSpecificColumns();
    return [...base, specific.entryRate];
  }, [getBaseColumns, getTabSpecificColumns, t]);

  const exitPagesColumns = useMemo(() => {
    const base = getBaseColumns();
    const specific = getTabSpecificColumns();
    return [...base, specific.exitRate];
  }, [getBaseColumns, getTabSpecificColumns, t]);

  const tableTabs = useMemo(
    () => [
      {
        key: 'all',
        label: t('allPages'),
        data: allPagesData,
        columns: allPagesColumns,
        defaultSorting: [{ id: 'pageviews', desc: true }],
        loading: allPagesLoading,
      },
      {
        key: 'entry',
        label: t('entryPages'),
        data: entryPagesData,
        columns: entryPagesColumns,
        defaultSorting: [{ id: 'pageviews', desc: true }],
        loading: entryPagesLoading,
      },
      {
        key: 'exit',
        label: t('exitPages'),
        data: exitPagesData,
        columns: exitPagesColumns,
        defaultSorting: [{ id: 'pageviews', desc: true }],
        loading: exitPagesLoading,
      },
    ],
    [allPagesData, entryPagesData, exitPagesData, allPagesColumns, entryPagesColumns, exitPagesColumns, allPagesLoading, entryPagesLoading, exitPagesLoading, t],
  );

  return (
    <TabbedTable
      title={t('title')}
      loading={loading}
      tabs={tableTabs}
      defaultTab='all'
      tabValue={activeTab}
      onTabValueChange={onTabChange}
      searchColumn='path'
      searchFieldLabel={t('path')}
    />
  );
}
