'use client';

import { type RefObject, useEffect, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Row,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown } from 'lucide-react';
import DataEmptyComponent from './DataEmptyComponent';

const SKELETON_ROWS = 10;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  defaultSorting?: SortingState;
  className?: string;
  onRowClick?: (row: Row<TData>) => void;
  tableRef?: RefObject<ReturnType<typeof useReactTable<TData>> | null>;
  loading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  defaultSorting = [],
  className,
  onRowClick,
  tableRef,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations('dashboard.emptyStates');
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
  });

  useEffect(() => {
    if (tableRef) {
      tableRef.current = table;
    }
  }, []);

  return (
    <div className={`rounded-lg ${className || ''} border-border overflow-hidden border`}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className='border-muted-foreground bg-accent hover:bg-accent border-b'>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`text-foreground bg-muted/50 px-3 py-3 text-left text-sm font-medium sm:px-6 ${
                    header.column.getCanSort()
                      ? 'hover:!bg-input/40 dark:hover:!bg-accent cursor-pointer select-none'
                      : ''
                  }`}
                  style={header.column.columnDef.minSize ? { minWidth: header.column.columnDef.minSize } : undefined}
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
        <TableBody className='divide-secondary divide-y'>
          {loading ? (
            Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
              <TableRow key={rowIndex} className='hover:bg-accent dark:hover:bg-primary/10'>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex} className='px-3 py-3 sm:px-6'>
                    <Skeleton className={colIndex === 0 ? 'h-4 w-3/5' : 'h-4 w-16'} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={`hover:bg-accent dark:hover:bg-primary/10 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className='text-muted-foreground px-3 py-3 text-sm sm:px-6'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <DataEmptyComponent />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
