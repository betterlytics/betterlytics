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
import { useTranslations } from 'next-intl';
import ResponsiveSparkline from '@/components/ResponsiveSparkline';

interface TabbedPagesTableProps {
  allPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
  entryPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
  exitPagesData: Awaited<ReturnType<typeof fetchPageAnalyticsAction>>;
}

const formatPath = (path: string): string => {
  return path || '/';
};

// Generate deterministic pseudo-random values for the sparkline so it has ups and downs
const hashStringToNumber = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const createDeterministicRandom = (seed: number): (() => number) => {
  let a = seed | 0;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const generateSparklineValues = (baseValue: number, key: string, points = 16): number[] => {
  const seed = hashStringToNumber(key || '/');
  const rand = createDeterministicRandom(seed);
  const amplitude = Math.max(Math.round(baseValue * 0.2), 5);
  const center = Math.max(baseValue, 1);
  const values: number[] = [];
  for (let i = 0; i < points; i += 1) {
    const sine = Math.sin((i / points) * Math.PI * 2);
    const noise = (rand() - 0.5) * 0.6; // small randomness for variation
    const delta = Math.round(amplitude * (0.25 * sine + 0.15 * noise));
    values.push(Math.max(0, center + delta));
  }
  return values;
};

export default function TabbedPagesTable({ allPagesData, entryPagesData, exitPagesData }: TabbedPagesTableProps) {
  const { addQueryFilter } = useQueryFiltersContext();
  const t = useTranslations('components.pages.table');

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
        header: t('path'),
        cell: ({ row }) => {
          const path = formatPath(row.original.path);
          return (
            <Button
              variant='ghost'
              onClick={() => handlePathClick(path)}
              className='cursor-pointer bg-transparent text-left font-medium transition-colors'
              title={t('filterByPath', { path })}
            >
              {path}
            </Button>
          );
        },
      },
      {
        accessorKey: 'visitors',
        header: t('visitors'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='visitors' />,
        accessorFn: (row) => row.current.visitors,
      },
      {
        accessorKey: 'pageviews',
        header: t('pageviews'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='pageviews' />,
        accessorFn: (row) => row.current.pageviews,
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
        size: 100,
      },
    ];
  }, [handlePathClick]);

  const getSparklineColumn = useCallback((): ColumnDef<
    Awaited<ReturnType<typeof fetchPageAnalyticsAction>>[number]
  > => {
    return {
      id: 'sparkline',
      header: '',
      cell: ({ row }) => {
        const current = row.original.current.pageviews ?? 0;
        const compare = row.original.compare?.pageviews ?? current;
        const base = Math.max(1, Math.round((current + compare) / 2));
        const key = `${row.original.path || '/'}:${base}`;
        const values = generateSparklineValues(base, key);
        return <ResponsiveSparkline values={values} height={20} />;
      },
      enableSorting: false,
      size: 80,
    };
  }, []);

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
  }, []);

  const allPagesColumns = useMemo(() => {
    const base = getBaseColumns();
    return [...base, getSparklineColumn()];
  }, [getBaseColumns, getSparklineColumn]);

  const entryPagesColumns = useMemo(() => {
    const base = getBaseColumns();
    const specific = getTabSpecificColumns();
    return [...base, specific.entryRate, getSparklineColumn()];
  }, [getBaseColumns, getTabSpecificColumns, getSparklineColumn]);

  const exitPagesColumns = useMemo(() => {
    const base = getBaseColumns();
    const specific = getTabSpecificColumns();
    return [...base, specific.exitRate, getSparklineColumn()];
  }, [getBaseColumns, getTabSpecificColumns, getSparklineColumn]);

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
    [allPagesData, entryPagesData, exitPagesData, allPagesColumns, entryPagesColumns, exitPagesColumns],
  );

  return (
    <TabbedTable
      title={t('title')}
      description={t('description')}
      tabs={tableTabs}
      defaultTab='all'
      searchColumn='path'
      searchFieldLabel={t('path')}
    />
  );
}
