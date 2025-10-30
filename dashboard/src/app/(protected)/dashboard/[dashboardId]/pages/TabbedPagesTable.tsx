'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useCallback } from 'react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { Button } from '@/components/ui/button';
import { formatNumber, formatPercentage, formatString } from '@/utils/formatters';
import TabbedTable from '@/components/TabbedTable';
import { fetchPageAnalyticsAction } from '@/app/actions/pages';
import { TableCompareCell } from '@/components/TableCompareCell';
import { TableTrendIndicator } from '@/components/TableTrendIndicator';
import { formatDuration } from '@/utils/dateFormatters';
import { useTranslations } from 'next-intl';

interface TabbedPagesTableProps {
  allPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
  entryPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
  exitPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
}

const formatPath = (path: string): string => {
  return path || '/';
};

export default function TabbedPagesTable({ allPagesData, entryPagesData, exitPagesData }: TabbedPagesTableProps) {
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });
  const t = useTranslations('components.pages.table');

  const getBaseColumns = useCallback((): ColumnDef<
    Awaited<ReturnType<typeof fetchPageAnalyticsAction>>[number]
  >[] => {
    return [
      {
        accessorKey: 'path',
        header: t('path'),
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
        accessorKey: 'scrollDepthPercentage',
        header: t('scrollDepthPercentage'),
        cell: ({ row }) => (
          <TableCompareCell row={row.original} dataKey='scrollDepthPercentage' formatter={formatPercentage} />
        ),
        accessorFn: (row) => row.current.scrollDepthPercentage,
      },
      {
        accessorKey: 'bounceRate',
        header: t('bounceRate'),
        cell: ({ row }) => (
          <TableCompareCell row={row.original} dataKey='bounceRate' formatter={formatPercentage} />
        ),
        accessorFn: (row) => row.current.bounceRate,
      },
      {
        accessorKey: 'avgTime',
        header: t('avgTime'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='avgTime' formatter={formatDuration} />,
        accessorFn: (row) => row.current.avgTime,
      },
    ];
  }, [makeFilterClick, t]);

  const getTabSpecificColumns = useCallback((): Record<
    string,
    ColumnDef<Awaited<ReturnType<typeof fetchPageAnalyticsAction>>[number]>
  > => {
    return {
      entryRate: {
        accessorKey: 'entryRate',
        header: t('entryRate'),
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <div>{formatPercentage(row.original.current.entryRate ?? 0)}</div>
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
            <div>{formatPercentage(row.original.current.exitRate ?? 0)}</div>
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
  }, [t]);

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
      },
      {
        key: 'entry',
        label: t('entryPages'),
        data: entryPagesData,
        columns: entryPagesColumns,
        defaultSorting: [{ id: 'pageviews', desc: true }],
      },
      {
        key: 'exit',
        label: t('exitPages'),
        data: exitPagesData,
        columns: exitPagesColumns,
        defaultSorting: [{ id: 'pageviews', desc: true }],
      },
    ],
    [allPagesData, entryPagesData, exitPagesData, allPagesColumns, entryPagesColumns, exitPagesColumns, t],
  );

  return (
    <TabbedTable
      title={t('title')}
      tabs={tableTabs}
      defaultTab='all'
      searchColumn='path'
      searchFieldLabel={t('path')}
    />
  );
}
