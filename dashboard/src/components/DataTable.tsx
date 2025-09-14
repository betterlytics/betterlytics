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
import { useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  defaultSorting?: SortingState;
  className?: string;
  onRowClick?: (row: Row<TData>) => void;
  tableRef?: RefObject<ReturnType<typeof useReactTable<TData>> | null>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  defaultSorting = [],
  className,
  onRowClick,
  tableRef,
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
            <TableRow
              key={headerGroup.id}
              className='border-muted-foreground bg-table-header hover:bg-table-header border-b'
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`text-foreground dark:bg-muted/50 px-3 py-3 text-left text-sm font-medium sm:px-6 ${
                    header.column.getCanSort() ? 'hover:!bg-table-header-hover cursor-pointer select-none' : ''
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
        <TableBody className='divide-secondary divide-y'>
          {table.getRowModel().rows?.length ? (
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
                <div className='flex h-[300px] items-center justify-center'>
                  <div className='text-center'>
                    <p className='text-muted-foreground mb-1'>{t('noData')}</p>
                    <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
