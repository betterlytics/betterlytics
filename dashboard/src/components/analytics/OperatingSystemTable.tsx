'use client';

import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { OSIcon } from '@/components/icons';
import type { BARouterOutputs } from '@/trpc/client';
import { TableTrendIndicator } from '@/components/TableTrendIndicator';
import { formatPercentage } from '@/utils/formatters';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useFilterClick } from '@/hooks/use-filter-click';

interface OperatingSystemTableProps {
  data: BARouterOutputs['devices']['osBreakdown'];
  loading?: boolean;
}

export default function OperatingSystemTable({ data, loading }: OperatingSystemTableProps) {
  const locale = useLocale();
  const tCols = useTranslations('components.devices.tables.columns');
  const tFilters = useTranslations('components.filters');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });
  const columns: ColumnDef<BARouterOutputs['devices']['osBreakdown'][number]>[] = [
    {
      accessorKey: 'os',
      header: tCols('os'),
      minSize: 150,
      cell: ({ row }) => (
        <Button
          variant='ghost'
          onClick={() => makeFilterClick('os')(row.original.os)}
          className='cursor-pointer bg-transparent p-1 text-left text-sm font-medium select-text'
          title={tFilters('filterBy', { label: row.original.os })}
        >
          <span className='flex items-center gap-2'>
            <OSIcon name={row.original.os} className='h-4 w-4' />
            <span>{row.original.os}</span>
          </span>
        </Button>
      ),
    },
    {
      accessorKey: 'visitors',
      header: tCols('visitors'),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <div>{row.original.current.visitors.toLocaleString(locale)}</div>
          <TableTrendIndicator
            current={row.original.current.visitors}
            compare={row.original.compare?.visitors}
            percentage={row.original.change?.visitors}
          />
        </div>
      ),
      accessorFn: (row) => row.current.visitors,
    },
    {
      accessorKey: 'percentage',
      header: tCols('percentage'),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <div>{formatPercentage(row.original.current.percentage, locale)}</div>
          <TableTrendIndicator
            current={row.original.current.percentage}
            compare={row.original.compare?.percentage}
            percentage={row.original.change?.percentage}
            formatter={formatPercentage}
          />
        </div>
      ),
      accessorFn: (row) => row.current.percentage,
    },
  ];

  return (
    <div className='mt-2 overflow-x-auto'>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        defaultSorting={[{ id: 'visitors', desc: true }]}
        className='w-full'
      />
    </div>
  );
}
