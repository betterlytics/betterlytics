'use client';

import { ColumnDef } from '@tanstack/react-table';
import { PageAnalytics } from '@/entities/pages';
import { formatDuration } from '@/utils/dateFormatters';
import { useMemo, useCallback } from 'react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Button } from '@/components/ui/button';
import { formatPercentage } from '@/utils/formatters';
import TabbedTable, { TabDefinition } from '@/components/TabbedTable';

interface TabbedPagesTableProps {
  allPagesData: PageAnalytics[];
  entryPagesData: PageAnalytics[];
  exitPagesData: PageAnalytics[];
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

  const getBaseColumns = useCallback((): ColumnDef<PageAnalytics>[] => {
    return [
      {
        accessorKey: 'path',
        header: 'Path',
        cell: ({ row }: { row: { original: PageAnalytics } }) => {
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
        cell: ({ row }: { row: { original: PageAnalytics } }) => row.original.visitors.toLocaleString(),
      },
      {
        accessorKey: 'pageviews',
        header: 'Pageviews',
        cell: ({ row }: { row: { original: PageAnalytics } }) => row.original.pageviews.toLocaleString(),
      },
      {
        accessorKey: 'bounceRate',
        header: 'Bounce Rate',
        cell: ({ row }: { row: { original: PageAnalytics } }) => formatPercentage(row.original.bounceRate),
      },
      {
        accessorKey: 'avgTime',
        header: 'Avg. Time',
        cell: ({ row }: { row: { original: PageAnalytics } }) => formatDuration(row.original.avgTime),
      },
    ];
  }, [handlePathClick]);

  const getTabSpecificColumns = useCallback((): Record<string, ColumnDef<PageAnalytics>> => {
    return {
      entryRate: {
        accessorKey: 'entryRate',
        header: 'Entry Rate',
        cell: ({ row }: { row: { original: PageAnalytics } }) => formatPercentage(row.original.entryRate ?? 0),
      },
      exitRate: {
        accessorKey: 'exitRate',
        header: 'Exit Rate',
        cell: ({ row }: { row: { original: PageAnalytics } }) => formatPercentage(row.original.exitRate ?? 0),
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

  const tableTabs: TabDefinition<PageAnalytics>[] = useMemo(
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
