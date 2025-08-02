'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useCallback } from 'react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Button } from '@/components/ui/button';
import { formatPercentage } from '@/utils/formatters';
import TabbedTable, { TabDefinition } from '@/components/TabbedTable';
import { fetchPageAnalyticsAction } from '@/app/actions/pages';
import { TableCompareCell } from '@/components/TableCompareCell';
import { TableTrendIndicator } from '@/components/TableTrendIndicator';
import { formatDuration } from '@/utils/dateFormatters';

interface TabbedPagesTableProps {
  allPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
  entryPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
  exitPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
}

const formatPath = (path: string): string => {
  return path || '/';
};

export default function TabbedPagesTable({ allPagesData, entryPagesData, exitPagesData }: TabbedPagesTableProps) {
  const { addQueryFilter } = useQueryFiltersContext();

  const handlePathClick = useCallback(
    (path: string) => {
      addQueryFilter({
        column: 'url',
        operator: '=',
        value: path,
      });
    },
    [addQueryFilter],
  );

  const getBaseColumns = useCallback((): ColumnDef<
    Awaited<ReturnType<typeof fetchPageAnalyticsAction>>[number]
  >[] => {
    return [
      {
        accessorKey: 'path',
        header: 'Path',
        cell: ({ row }) => {
          const path = formatPath(row.original.path);
          return (
            <Button
              variant='ghost'
              onClick={() => handlePathClick(path)}
              className='cursor-pointer bg-transparent text-left font-medium transition-colors'
              title={`Filter by ${path}`}
            >
              {path}
            </Button>
          );
        },
      },
      {
        accessorKey: 'visitors',
        header: 'Visitors',
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='visitors' />,
        accessorFn: (row) => row.current.visitors,
      },
      {
        accessorKey: 'pageviews',
        header: 'Pageviews',
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='pageviews' />,
        accessorFn: (row) => row.current.pageviews,
      },
      {
        accessorKey: 'bounceRate',
        header: 'Bounce Rate',
        cell: ({ row }) => (
          <TableCompareCell row={row.original} dataKey='bounceRate' formatter={formatPercentage} />
        ),
        accessorFn: (row) => row.current.bounceRate,
      },
      {
        accessorKey: 'avgTime',
        header: 'Avg. Time',
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='avgTime' formatter={formatDuration} />,
        accessorFn: (row) => row.current.avgTime,
      },
    ];
  }, [handlePathClick]);

  const getTabSpecificColumns = useCallback((): Record<
    string,
    ColumnDef<Awaited<ReturnType<typeof fetchPageAnalyticsAction>>[number]>
  > => {
    return {
      entryRate: {
        accessorKey: 'entryRate',
        header: 'Entry Rate',
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
        header: 'Exit Rate',
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
  }, []);

  const allPagesColumns = useMemo(() => getBaseColumns(), [getBaseColumns]);

  const entryPagesColumns = useMemo(() => {
    const base = getBaseColumns();
    const specific = getTabSpecificColumns();
    return [...base, specific.entryRate];
  }, [getBaseColumns, getTabSpecificColumns]);

  const exitPagesColumns = useMemo(() => {
    const base = getBaseColumns();
    const specific = getTabSpecificColumns();
    return [...base, specific.exitRate];
  }, [getBaseColumns, getTabSpecificColumns]);

  const tableTabs = useMemo(
    () => [
      {
        key: 'all',
        label: 'All Pages',
        data: allPagesData,
        columns: allPagesColumns,
        defaultSorting: [{ id: 'pageviews', desc: true }],
      },
      {
        key: 'entry',
        label: 'Entry Pages',
        data: entryPagesData,
        columns: entryPagesColumns,
        defaultSorting: [{ id: 'pageviews', desc: true }],
      },
      {
        key: 'exit',
        label: 'Exit Pages',
        data: exitPagesData,
        columns: exitPagesColumns,
        defaultSorting: [{ id: 'pageviews', desc: true }],
      },
    ],
    [allPagesData, entryPagesData, exitPagesData, allPagesColumns, entryPagesColumns, exitPagesColumns],
  );

  return (
    <TabbedTable
      title='Page Analytics'
      description='Analytics for all tracked pages'
      tabs={tableTabs}
      defaultTab='all'
      searchColumn='path'
    />
  );
}
