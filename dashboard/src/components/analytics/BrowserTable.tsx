'use client';

import { BrowserStats } from '@/entities/analytics/devices.entities';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { BrowserIcon } from '@/components/icons';
import type { ToDataTable } from '@/presenters/toDataTable';
import { TableCompareCell } from '../TableCompareCell';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useFilterClick } from '@/hooks/use-filter-click';

interface BrowserTableProps {
  data: ToDataTable<'browser', BrowserStats>[];
}

export default function BrowserTable({ data }: BrowserTableProps) {
  const tCols = useTranslations('components.devices.tables.columns');
  const tFilters = useTranslations('components.filters');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });
  const columns: ColumnDef<ToDataTable<'browser', BrowserStats>>[] = [
    {
      accessorKey: 'browser',
      header: tCols('browser'),
      cell: ({ row }) => (
        <Button
          variant='ghost'
          onClick={() => makeFilterClick('browser')(row.original.browser)}
          className='cursor-pointer bg-transparent p-1 text-left text-sm font-medium'
          title={tFilters('filterBy', { label: row.original.browser })}
        >
          <span className='flex items-center gap-2'>
            <BrowserIcon name={row.original.browser} className='h-4 w-4' />
            <span>{row.original.browser}</span>
          </span>
        </Button>
      ),
    },
    {
      accessorKey: 'visitors',
      header: tCols('visitors'),
      cell: ({ row }) => <TableCompareCell row={row.original} dataKey='visitors' />,
      accessorFn: (row) => row.current.visitors,
    },
    {
      accessorKey: 'percentage',
      header: tCols('percentage'),
      cell: ({ row }) => <TableCompareCell row={row.original} dataKey='percentage' formatter={formatPercentage} />,
      accessorFn: (row) => row.current.percentage,
    },
  ];

  return (
    <div className='mt-2 overflow-x-auto'>
      <DataTable
        columns={columns}
        data={data}
        defaultSorting={[{ id: 'visitors', desc: true }]}
        className='w-full'
      />
    </div>
  );
}
