'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, RefreshCw, MoreHorizontal, CheckCircle, EyeOff, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ErrorSparklineChart } from './ErrorSparklineChart';
import { fetchErrorGroupVolumesAction, upsertErrorGroupAction, bulkUpsertErrorGroupAction } from '@/app/actions/analytics/errors.actions';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';
import { formatElapsedTime } from '@/utils/dateFormatters';
import type { TimeSeriesPoint } from '@/presenters/toTimeSeries';
import type { ErrorGroupRow, ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';

const RECENT_THRESHOLD_MS = 60 * 60 * 1000;
const PAGE_SIZE = 10;

type StatusFilter = 'all' | ErrorGroupStatusValue;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unresolved', label: 'Unresolved' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'ignored', label: 'Ignored' },
];

const CENTER_COLUMNS = new Set(['count', 'session_count']);

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

const STATUS_CONFIG: Record<ErrorGroupStatusValue, { label: string; className: string }> = {
  unresolved: {
    label: 'Unresolved',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  },
  ignored: {
    label: 'Ignored',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

type ErrorTableProps = {
  errorGroups: ErrorGroupRow[];
  initialVolumeMap: Record<string, TimeSeriesPoint[]>;
  timeBuckets: TimeSeriesPoint[];
  dashboardId: string;
};

export function ErrorTable({
  errorGroups,
  initialVolumeMap,
  timeBuckets,
  dashboardId,
}: ErrorTableProps) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const query = useAnalyticsQuery();
  const { staleTime, gcTime, refetchOnWindowFocus } = useTimeRangeQueryOptions();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'count', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  const [statusOverrides, setStatusOverrides] = useState<Record<string, ErrorGroupStatusValue>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unresolved');

  const getStatus = (fingerprint: string, base: ErrorGroupStatusValue): ErrorGroupStatusValue =>
    statusOverrides[fingerprint] ?? base;

  const statusCounts = useMemo(() => {
    const counts = { all: errorGroups.length, unresolved: 0, resolved: 0, ignored: 0 };
    for (const g of errorGroups) counts[getStatus(g.error_fingerprint, g.status)]++;
    return counts;
  }, [errorGroups, statusOverrides]);

  const filteredByStatus = useMemo(
    () => statusFilter === 'all' ? errorGroups : errorGroups.filter((g) => getStatus(g.error_fingerprint, g.status) === statusFilter),
    [errorGroups, statusFilter, statusOverrides],
  );

  async function setStatus(fingerprint: string, status: ErrorGroupStatusValue) {
    setStatusOverrides((prev) => ({ ...prev, [fingerprint]: status }));
    setRowSelection((prev) => { const next = { ...prev }; delete next[fingerprint]; return next; });
    await upsertErrorGroupAction(dashboardId, fingerprint, status);
  }

  async function bulkSetStatus(fingerprints: string[], status: ErrorGroupStatusValue) {
    setStatusOverrides((prev) => {
      const next = { ...prev };
      for (const fp of fingerprints) next[fp] = status;
      return next;
    });
    await bulkUpsertErrorGroupAction(dashboardId, fingerprints, status);
    setRowSelection({});
  }

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
        header: 'Error',
        cell: ({ row }) => {
          const error = row.original;
          return (
            <div className='min-w-0'>
              <div className='font-mono text-sm font-semibold'>{error.error_type}</div>
              <div className='text-muted-foreground truncate text-sm'>{error.error_message}</div>
            </div>
          );
        },
      },
      {
        id: 'volume',
        header: 'Volume',
        cell: () => null, // rendered manually below to inject volumeMap
        enableSorting: false,
      },
      {
        accessorKey: 'count',
        header: 'Occurrences',
        cell: ({ getValue }) => (
          <div className='text-center tabular-nums'>{formatCount(getValue() as number)}</div>
        ),
      },
      {
        accessorKey: 'session_count',
        header: 'Sessions',
        cell: ({ getValue }) => (
          <div className='text-center tabular-nums'>{formatCount(getValue() as number)}</div>
        ),
      },
      {
        id: 'first_seen',
        accessorFn: (row) => row.first_seen?.getTime() ?? 0,
        header: 'First seen',
        cell: ({ row }) => {
          const firstSeen = row.original.first_seen;
          return firstSeen ? `${formatElapsedTime(firstSeen)} ago` : '—';
        },
      },
      {
        id: 'last_seen',
        accessorFn: (row) => row.last_seen.getTime(),
        header: 'Last seen',
        cell: ({ row }) => {
          const isRecent = Date.now() - row.original.last_seen.getTime() < RECENT_THRESHOLD_MS;
          return (
            <div className='flex items-center gap-1.5'>
              {isRecent && <span className='h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-destructive' />}
              {formatElapsedTime(row.original.last_seen)} ago
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => {
          const status = getStatus(row.original.error_fingerprint, row.original.status);
          const cfg = STATUS_CONFIG[status];
          return (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
              {cfg.label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const fp = row.original.error_fingerprint;
          const currentStatus = getStatus(fp, row.original.status);
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100'
                  onClick={(e) => e.stopPropagation()}
                  aria-label='Row actions'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {currentStatus !== 'resolved' && (
                  <DropdownMenuItem onClick={() => setStatus(fp, 'resolved')}>
                    <CheckCircle className='mr-2 h-4 w-4 text-emerald-600' />
                    Mark resolved
                  </DropdownMenuItem>
                )}
                {currentStatus !== 'ignored' && (
                  <DropdownMenuItem onClick={() => setStatus(fp, 'ignored')}>
                    <EyeOff className='mr-2 h-4 w-4' />
                    Ignore
                  </DropdownMenuItem>
                )}
                {currentStatus !== 'unresolved' && (
                  <DropdownMenuItem onClick={() => setStatus(fp, 'unresolved')}>
                    <RotateCcw className='mr-2 h-4 w-4' />
                    Mark unresolved
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [statusOverrides],
  );

  const table = useReactTable({
    data: filteredByStatus,
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

  const selectedFingerprints = Object.keys(rowSelection);
  const selectedCount = selectedFingerprints.length;
  const filteredCount = table.getFilteredRowModel().rows.length;

  function changeStatusFilter(next: StatusFilter) {
    setStatusFilter(next);
    setRowSelection({});
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  return (
    <div className='space-y-3'>
      <div className='flex gap-1 border-b border-border'>
        {STATUS_FILTERS.map(({ key, label }) => {
          const isActive = statusFilter === key;
          return (
            <button
              key={key}
              type='button'
              onClick={() => changeStatusFilter(key)}
              className={[
                'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${isActive ? 'bg-primary/10 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                {statusCounts[key]}
              </span>
            </button>
          );
        })}
      </div>

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
        <Button
          variant='outline'
          size='sm'
          className='ml-auto shrink-0'
          disabled={isRefreshing}
          onClick={() => startRefreshTransition(() => router.refresh())}
          aria-label='Reload errors'
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className='bg-muted/50 border-border flex items-center gap-3 rounded-lg border px-4 py-2'>
          <span className='text-muted-foreground text-sm'>{selectedCount} selected</span>
          <div className='flex items-center gap-2 ml-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => bulkSetStatus(selectedFingerprints, 'resolved')}
            >
              <CheckCircle className='mr-1.5 h-3.5 w-3.5 text-emerald-600' />
              Resolve
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => bulkSetStatus(selectedFingerprints, 'ignored')}
            >
              <EyeOff className='mr-1.5 h-3.5 w-3.5' />
              Ignore
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => bulkSetStatus(selectedFingerprints, 'unresolved')}
            >
              <RotateCcw className='mr-1.5 h-3.5 w-3.5' />
              Unresolve
            </Button>
          </div>
        </div>
      )}

      <div className='border-border overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='border-muted-foreground bg-accent hover:bg-accent border-b'>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const isCentered = CENTER_COLUMNS.has(header.id);
                  return (
                    <TableHead
                      key={header.id}
                      className={[
                        'text-foreground bg-muted/50 py-3 text-sm font-medium',
                        header.id === 'select' ? 'w-10 pl-4 sm:pl-6' : 'px-3 sm:px-6',
                        header.id === 'volume' ? 'hidden lg:table-cell' : '',
                        header.id === 'first_seen' ? 'hidden md:table-cell' : '',
                        header.id === 'actions' ? 'w-10' : '',
                        canSort ? 'hover:!bg-input/40 dark:hover:!bg-accent cursor-pointer select-none' : '',
                      ].join(' ')}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={`flex items-center gap-1 ${isCentered ? 'justify-center' : ''}`}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted && (
                          <span className='ml-1'>
                            {sorted === 'desc' ? <ArrowDown className='h-4 w-4' /> : <ArrowUp className='h-4 w-4' />}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className='divide-secondary divide-y'>
            {filteredCount === 0 ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={9} className='py-12 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    {globalFilter.trim() ? 'No errors matching your search.' : 'No errors recorded in this period.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : visibleRows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className='hover:bg-accent dark:hover:bg-primary/10 group cursor-pointer'
                onClick={() => router.push(`/dashboard/${dashboardId}/errors/detail/${row.original.error_fingerprint}`)}
              >
                {row.getVisibleCells().map((cell) => {
                  if (cell.column.id === 'volume') {
                    return (
                      <TableCell key={cell.id} className='hidden lg:table-cell px-3 py-3 sm:px-6'>
                        <ErrorSparklineChart data={volumeMap?.[row.original.error_fingerprint] ?? []} />
                      </TableCell>
                    );
                  }
                  if (cell.column.id === 'select') {
                    return (
                      <TableCell key={cell.id} className='w-10 py-3 pl-4 sm:pl-6'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  }
                  if (cell.column.id === 'actions') {
                    return (
                      <TableCell key={cell.id} className='w-10 py-3 pr-2 sm:pr-4'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell
                      key={cell.id}
                      className={[
                        'text-muted-foreground px-3 py-3 text-sm sm:px-6',
                        cell.column.id === 'error' ? 'w-full max-w-0 pl-2' : '',
                        cell.column.id === 'first_seen' ? 'hidden md:table-cell' : '',
                      ].join(' ')}
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

      {filteredCount > 0 && table.getPageCount() > 1 && (
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
    </div>
  );
}
