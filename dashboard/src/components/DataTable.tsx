'use client';

import { useState } from 'react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  defaultSorting?: SortingState;
  className?: string;
  onRowClick?: (row: Row<TData>) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  defaultSorting = [],
  className,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className={`rounded-lg ${className || ''} overflow-hidden border border-gray-200 dark:border-slate-700`}>
      <Table>
        <TableHeader className='bg-gray-50 dark:bg-slate-800'>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className='border-b border-gray-200 dark:border-slate-700'>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400 ${
                    header.column.getCanSort()
                      ? 'cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-slate-700'
                      : ''
                  }`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className='flex items-center'>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() && (
                      <span className='ml-2'>
                        {header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className='h-4 w-4' />
                        ) : (
                          <ArrowUp className='h-4 w-4' />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className='divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900'>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className='px-4 py-3 text-sm text-slate-700 dark:text-slate-300'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className='h-24 px-4 py-3 text-center text-gray-500 dark:text-slate-400'
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
