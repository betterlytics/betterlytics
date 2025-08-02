'use client';

import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { OSIcon } from '@/components/icons';
import { fetchOperatingSystemBreakdownAction } from '@/app/actions/devices';
import { TableTrendIndicator } from '@/components/TableTrendIndicator';

interface OperatingSystemTableProps {
  data: Awaited<ReturnType<typeof fetchOperatingSystemBreakdownAction>>;
}

export default function OperatingSystemTable({ data }: OperatingSystemTableProps) {
  const columns: ColumnDef<Awaited<ReturnType<typeof fetchOperatingSystemBreakdownAction>>[number]>[] = [
    {
      accessorKey: 'os',
      header: 'Operating System',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <OSIcon name={row.original.os} className='h-4 w-4' />
          <span>{row.original.os}</span>
        </div>
      ),
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <div>{row.original.current.visitors.toLocaleString()}</div>
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
      header: 'Percentage',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <div>{`${row.original.current.percentage}%`}</div>
          <TableTrendIndicator
            current={row.original.current.percentage}
            compare={row.original.compare?.percentage}
            percentage={row.original.change?.percentage}
            formatter={(val) => `${val}%`}
          />
        </div>
      ),
      accessorFn: (row) => row.current.percentage,
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
