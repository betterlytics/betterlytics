'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { ErrorMiniBarChart } from './ErrorMiniBarChart';
import { ErrorsEmptyState } from './ErrorsEmptyState';
import { fetchErrorGroupVolumesAction } from '@/app/actions/analytics/errors.actions';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';
import { formatElapsedTime } from '@/utils/dateFormatters';
import type { TimeSeriesPoint } from '@/presenters/toTimeSeries';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';

const RECENT_THRESHOLD_MS = 60 * 60 * 1000;
const PAGE_SIZE = 10;

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

type ErrorListProps = {
  hasAnyErrors: boolean;
  errorGroups: ErrorGroupRow[];
  initialVolumeMap: Record<string, TimeSeriesPoint[]>;
  timeBuckets: TimeSeriesPoint[];
  dashboardId: string;
};

export function ErrorList({ hasAnyErrors, errorGroups, initialVolumeMap, timeBuckets, dashboardId }: ErrorListProps) {
  if (!hasAnyErrors) {
    return <ErrorsEmptyState />;
  }

  return (
    <ErrorTableInner
      errorGroups={errorGroups}
      initialVolumeMap={initialVolumeMap}
      timeBuckets={timeBuckets}
      dashboardId={dashboardId}
    />
  );
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className='h-3 w-3' />;
  if (sorted === 'desc') return <ArrowDown className='h-3 w-3' />;
  return <ArrowUpDown className='h-3 w-3 opacity-40' />;
}

function ErrorTableInner({
  errorGroups,
  initialVolumeMap,
  timeBuckets,
  dashboardId,
}: Omit<ErrorListProps, 'hasAnyErrors'>) {
  const query = useAnalyticsQuery();
  const { staleTime, gcTime, refetchOnWindowFocus } = useTimeRangeQueryOptions();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'count', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  const columns = useMemo<ColumnDef<ErrorGroupRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label='Select all'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
            aria-label='Select row'
          />
        ),
        enableSorting: false,
      },
      {
        id: 'error',
        accessorFn: (row) => `${row.error_type} ${row.error_message}`,
        header: ({ column }) => (
          <button
            className='flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Error
            <SortIcon sorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const error = row.original;
          return (
            <div className='min-w-0'>
              <div className='text-sm font-semibold'>{error.error_type}</div>
              <div className='text-muted-foreground truncate text-sm'>{error.error_message}</div>
            </div>
          );
        },
      },
      {
        id: 'volume',
        header: () => (
          <span className='text-sm font-medium text-muted-foreground'>Volume</span>
        ),
        cell: () => null, // rendered manually below to inject volumeMap
        enableSorting: false,
      },
      {
        accessorKey: 'count',
        header: ({ column }) => (
          <div className='flex justify-center'>
            <button
              className='flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors'
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Occurrences
              <SortIcon sorted={column.getIsSorted()} />
            </button>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className='text-muted-foreground text-center tabular-nums text-sm'>{formatCount(getValue() as number)}</div>
        ),
      },
      {
        accessorKey: 'session_count',
        header: ({ column }) => (
          <div className='flex justify-center'>
            <button
              className='flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors'
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Sessions
              <SortIcon sorted={column.getIsSorted()} />
            </button>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className='text-muted-foreground text-center tabular-nums text-sm'>{formatCount(getValue() as number)}</div>
        ),
      },
      {
        id: 'first_seen',
        accessorFn: (row) => row.first_seen?.getTime() ?? 0,
        header: ({ column }) => (
          <button
            className='flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            First seen
            <SortIcon sorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const firstSeen = row.original.first_seen;
          return (
            <span className='text-muted-foreground tabular-nums text-sm'>
              {firstSeen ? `${formatElapsedTime(firstSeen)} ago` : '—'}
            </span>
          );
        },
      },
      {
        id: 'last_seen',
        accessorFn: (row) => row.last_seen.getTime(),
        header: ({ column }) => (
          <button
            className='flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Last seen
            <SortIcon sorted={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const isRecent = Date.now() - row.original.last_seen.getTime() < RECENT_THRESHOLD_MS;
          return (
            <div className='flex items-center gap-1.5'>
              {isRecent && <span className='h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-destructive' />}
              <span className='text-muted-foreground tabular-nums text-sm'>
                {formatElapsedTime(row.original.last_seen)} ago
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: errorGroups,
    columns,
    state: { sorting, rowSelection, globalFilter, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.error_fingerprint,
  });

  const visibleRows = table.getRowModel().rows;
  const visibleFingerprints = visibleRows.map((r) => r.original.error_fingerprint);
  const fingerprintKey = visibleFingerprints.join(',');
  const initialFingerprintKey = errorGroups.slice(0, PAGE_SIZE).map((g) => g.error_fingerprint).join(',');

  const { data: volumeMap } = useQuery({
    queryKey: [
      'error-group-volumes',
      dashboardId,
      query.startDate,
      query.endDate,
      query.granularity,
      query.timezone,
      query.queryFilters,
      fingerprintKey,
    ],
    queryFn: () => fetchErrorGroupVolumesAction(dashboardId, query, visibleFingerprints, timeBuckets),
    initialData: fingerprintKey === initialFingerprintKey ? initialVolumeMap : undefined,
    enabled: visibleFingerprints.length > 0,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
  });

  const selectedCount = Object.keys(rowSelection).length;
  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-3'>
        <div className='relative max-w-sm flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            type='text'
            placeholder='Search by type and message...'
            value={globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className='pl-9'
          />
        </div>
        {selectedCount > 0 && (
          <span className='text-muted-foreground text-sm'>{selectedCount} selected</span>
        )}
      </div>

      {filteredCount === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground text-sm'>
            {globalFilter.trim() ? 'No errors matching your search.' : 'No errors recorded in this period.'}
          </p>
        </div>
      ) : (
        <>
          <div className='border-border overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className='bg-muted/50 hover:bg-muted/50 border-b'>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={
                          header.id === 'select'
                            ? 'w-10 pl-4 sm:pl-6'
                            : header.id === 'volume'
                              ? 'hidden lg:table-cell px-3 sm:px-6'
                              : header.id === 'first_seen'
                                ? 'hidden md:table-cell px-3 sm:px-6'
                                : 'px-3 sm:px-6'
                        }
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className='hover:bg-accent dark:hover:bg-primary/10 group cursor-pointer'
                  >
                    {row.getVisibleCells().map((cell) => {
                      if (cell.column.id === 'volume') {
                        return (
                          <TableCell key={cell.id} className='hidden lg:table-cell px-3 py-4 sm:px-6'>
                            <ErrorMiniBarChart data={volumeMap?.[row.original.error_fingerprint] ?? []} />
                          </TableCell>
                        );
                      }
                      if (cell.column.id === 'select') {
                        return (
                          <TableCell key={cell.id} className='w-10 py-4 pl-4 sm:pl-6'>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell
                          key={cell.id}
                          className={
                            cell.column.id === 'error'
                              ? 'py-4 pl-2 pr-3 w-full max-w-0 sm:pr-6'
                              : cell.column.id === 'first_seen'
                                ? 'hidden md:table-cell px-3 py-4 sm:px-6'
                                : 'px-3 py-4 sm:px-6'
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {table.getPageCount() > 1 && (
            <div className='flex items-center justify-between py-1'>
              <span className='text-muted-foreground text-sm'>
                {filteredCount} error{filteredCount !== 1 ? 's' : ''}
              </span>
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground text-xs'>
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <div className='flex items-center'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 cursor-pointer'
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                    aria-label='Previous page'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 cursor-pointer'
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                    aria-label='Next page'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
