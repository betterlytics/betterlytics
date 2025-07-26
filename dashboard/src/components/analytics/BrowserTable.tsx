'use client';

import { BrowserStats } from '@/entities/devices';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { BrowserIcon } from '@/components/icons';
import type { ToDataTable } from '@/presenters/toDataTable';
import { TableCompareCell } from '../TableCompareCell';
import { formatPercentage } from '@/utils/formatters';

interface BrowserTableProps {
  data: ToDataTable<'browser', BrowserStats>[];
}

export default function BrowserTable({ data }: BrowserTableProps) {
  console.log(data);
  const columns: ColumnDef<ToDataTable<'browser', BrowserStats>>[] = [
    {
      accessorKey: 'browser',
      header: 'Browser',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <BrowserIcon name={row.original.browser} className='h-4 w-4' />
          <span>{row.original.browser}</span>
        </div>
      ),
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: ({ row }) => <TableCompareCell row={row.original} dataKey='visitors' />,
    },
    {
      accessorKey: 'percentage',
      header: 'Percentage',
      cell: ({ row }) => <TableCompareCell row={row.original} dataKey='percentage' formatter={formatPercentage} />,
    },
  ];

  return (
    <div className='overflow-x-auto'>
      <DataTable
        columns={columns}
        data={data}
        defaultSorting={[{ id: 'visitors', desc: true }]}
        className='w-full'
      />
    </div>
  );
}
