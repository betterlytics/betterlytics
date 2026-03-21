'use client';

import { useState, useMemo, useRef, useTransition, useEffect } from 'react';
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
} from '@tanstack/react-table';
import { Search, ArrowUp, ArrowDown, RefreshCw, MoreHorizontal, CheckCircle, EyeOff, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ErrorStatusActions } from './ErrorStatusActions';
import { PaginationControls } from '@/components/PaginationControls';
import { ErrorSparklineChart } from './ErrorSparklineChart';
import { fetchErrorGroupVolumesAction } from '@/app/actions/analytics/errors.actions';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';
import { useErrorGroupActions, type StatusFilter } from './use-error-group-actions';
import { formatElapsedTime } from '@/utils/dateFormatters';
import type { TimeSeriesPoint } from '@/presenters/toTimeSeries';
import { formatNumber } from '@/utils/formatters';
import type { ErrorGroupRow, ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';
import { STATUS_CONFIG } from './errors.constants';
import { ErrorTestScript } from './ErrorTestScript';

const RECENT_THRESHOLD_MS = 60 * 60 * 1000;
const PAGE_SIZE = 10;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unresolved', label: 'Unresolved' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'ignored', label: 'Ignored' },
];

function StatusFilterTabs({
  value,
  counts,
  onChange,
}: {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (filter: StatusFilter) => void;
}) {
  return (
    <div className='border-border flex gap-1 border-b'>
      {STATUS_FILTERS.map(({ key, label }) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type='button'
            onClick={() => onChange(key)}
            className={[
              '-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            ].join(' ')}
          >
            {label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${isActive ? 'bg-primary/10 text-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ErrorToolbar({
  selectedCount,
  selectedStatuses,
  isRefreshing,
  onResolve,
  onIgnore,
  onUnresolve,
  onReload,
  searchInput,
  onSearchChange,
}: {
  selectedCount: number;
  selectedStatuses: Set<ErrorGroupStatusValue>;
  isRefreshing: boolean;
  onResolve: () => void;
  onIgnore: () => void;
  onUnresolve: () => void;
  onReload: () => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
}) {
  const hasSelection = selectedCount > 0;
  const canResolve = hasSelection && (selectedStatuses.has('unresolved') || selectedStatuses.has('ignored'));
  const canIgnore = hasSelection && (selectedStatuses.has('unresolved') || selectedStatuses.has('resolved'));
  const canUnresolve = hasSelection && (selectedStatuses.has('resolved') || selectedStatuses.has('ignored'));

  return (
    <div className='flex items-center gap-3'>
      <div className='relative max-w-sm flex-1'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <Input
          type='text'
          placeholder='Search by type and message...'
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-9'
        />
      </div>
      <div className='ml-auto flex items-center gap-2'>
        {hasSelection && <span className='text-muted-foreground text-sm'>{selectedCount} selected</span>}
        <ErrorStatusActions
          canResolve={canResolve}
          canIgnore={canIgnore}
          canUnresolve={canUnresolve}
          onResolve={onResolve}
          onIgnore={onIgnore}
          onUnresolve={onUnresolve}
        />
        <Button
          variant='outline'
          size='sm'
          className='shrink-0 cursor-pointer'
          disabled={isRefreshing}
          onClick={onReload}
          aria-label='Reload errors'
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>
    </div>
  );
}

type ErrorTableProps = {
  errorGroups: ErrorGroupRow[];
  initialVolumeMap: Record<string, TimeSeriesPoint[]>;
  dashboardId: string;
};

export function ErrorTable({ errorGroups, initialVolumeMap, dashboardId }: ErrorTableProps) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const query = useAnalyticsQuery();
  const { staleTime, gcTime, refetchOnWindowFocus } = useTimeRangeQueryOptions();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'count', desc: true }]);
  const [searchInput, setSearchInput] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGlobalFilter(searchInput);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const volumeMapRef = useRef<Record<string, TimeSeriesPoint[]> | undefined>(undefined);

  const {
    statusFilter,
    statusCounts,
    filteredByStatus,
    getStatus,
    setStatus,
    bulkSetStatus,
    changeStatusFilter: setStatusFilterWithReset,
    rowSelection,
    setRowSelection,
    selectedFingerprints,
    selectedCount,
    selectedStatuses,
  } = useErrorGroupActions(errorGroups, dashboardId);

  const columns = useMemo<ColumnDef<ErrorGroupRow, unknown>[]>(
    () => [
      {
        id: 'select',
        meta: { cellClassName: 'w-10 py-3 pl-4 sm:pl-6', headerClassName: 'w-10 pl-4 sm:pl-6' },
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            className='mr-2 cursor-pointer'
            aria-label='Select all'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            className='cursor-pointer'
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
        meta: { cellClassName: 'w-full min-w-[200px] max-w-0' },
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
        meta: { cellClassName: 'hidden xl:table-cell', headerClassName: 'hidden xl:table-cell' },
        cell: ({ row }) => (
          <ErrorSparklineChart data={volumeMapRef.current?.[row.original.error_fingerprint] ?? []} />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'count',
        header: 'Occurrences',
        enableGlobalFilter: false,
        meta: { centered: true },
        cell: ({ getValue }) => (
          <div className='text-center tabular-nums'>{formatNumber(getValue() as number)}</div>
        ),
      },
      {
        accessorKey: 'session_count',
        header: 'Sessions',
        enableGlobalFilter: false,
        meta: { centered: true },
        cell: ({ getValue }) => (
          <div className='text-center tabular-nums'>{formatNumber(getValue() as number)}</div>
        ),
      },
      {
        id: 'first_seen',
        accessorFn: (row) => row.first_seen?.getTime() ?? 0,
        header: 'First seen',
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const firstSeen = row.original.first_seen;
          return firstSeen ? `${formatElapsedTime(firstSeen)} ago` : '—';
        },
      },
      {
        id: 'last_seen',
        accessorFn: (row) => row.last_seen!.getTime(),
        header: 'Last seen',
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const isRecent = Date.now() - row.original.last_seen!.getTime() < RECENT_THRESHOLD_MS;
          return (
            <div className='flex items-center gap-1.5'>
              {isRecent && <span className='bg-destructive h-1.5 w-1.5 shrink-0 animate-pulse rounded-full' />}
              {formatElapsedTime(row.original.last_seen!)} ago
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: 'Status',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const status = getStatus(row.original.error_fingerprint, row.original.status);
          const cfg = STATUS_CONFIG[status];
          return (
            <Badge variant='outline' className={cfg.className}>
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        meta: { cellClassName: 'w-10 pr-2 sm:pr-4', headerClassName: 'w-10' },
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
                  className='h-7 w-7 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100'
                  onClick={(e) => e.stopPropagation()}
                  aria-label='Row actions'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {currentStatus !== 'resolved' && (
                  <DropdownMenuItem className='cursor-pointer' onClick={() => setStatus(fp, 'resolved')}>
                    <CheckCircle className='mr-2 h-4 w-4 text-emerald-600' />
                    Mark resolved
                  </DropdownMenuItem>
                )}
                {currentStatus !== 'ignored' && (
                  <DropdownMenuItem className='cursor-pointer' onClick={() => setStatus(fp, 'ignored')}>
                    <EyeOff className='mr-2 h-4 w-4' />
                    Ignore
                  </DropdownMenuItem>
                )}
                {currentStatus !== 'unresolved' && (
                  <DropdownMenuItem className='cursor-pointer' onClick={() => setStatus(fp, 'unresolved')}>
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
    [getStatus],
  );

  const table = useReactTable({
    data: filteredByStatus,
    columns,
    state: { sorting, rowSelection, globalFilter, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
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
  const initialFingerprintKey = errorGroups
    .slice(0, PAGE_SIZE)
    .map((g) => g.error_fingerprint)
    .join(',');

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
    queryFn: () => fetchErrorGroupVolumesAction(dashboardId, query, visibleFingerprints),
    initialData: fingerprintKey === initialFingerprintKey ? initialVolumeMap : undefined,
    enabled: visibleFingerprints.length > 0,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
  });
  volumeMapRef.current = volumeMap;

  const filteredCount = table.getFilteredRowModel().rows.length;

  function changeStatusFilter(next: StatusFilter) {
    setStatusFilterWithReset(next);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  return (
    <div className='space-y-3'>
      <ErrorTestScript />
      <StatusFilterTabs value={statusFilter} counts={statusCounts} onChange={changeStatusFilter} />

      <ErrorToolbar
        selectedCount={selectedCount}
        selectedStatuses={selectedStatuses}
        isRefreshing={isRefreshing}
        onResolve={() => bulkSetStatus(selectedFingerprints, 'resolved')}
        onIgnore={() => bulkSetStatus(selectedFingerprints, 'ignored')}
        onUnresolve={() => bulkSetStatus(selectedFingerprints, 'unresolved')}
        onReload={() => startRefreshTransition(() => router.refresh())}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
      />

      <div className='border-border overflow-x-auto rounded-lg border'>
        <Table className='min-w-[800px]'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='border-muted-foreground bg-accent hover:bg-accent border-b'
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const meta = header.column.columnDef.meta as
                    | { centered?: boolean; headerClassName?: string }
                    | undefined;
                  return (
                    <TableHead
                      key={header.id}
                      className={[
                        'text-foreground bg-muted/50 py-3 text-sm font-medium',
                        meta?.headerClassName ?? 'px-3 sm:px-6',
                        canSort ? 'hover:!bg-input/40 dark:hover:!bg-accent cursor-pointer select-none' : '',
                      ].join(' ')}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={`flex items-center gap-1 ${meta?.centered ? 'justify-center' : ''}`}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted && (
                          <span className='ml-1'>
                            {sorted === 'desc' ? (
                              <ArrowDown className='h-4 w-4' />
                            ) : (
                              <ArrowUp className='h-4 w-4' />
                            )}
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
                <TableCell colSpan={table.getVisibleLeafColumns().length} className='py-12 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    {globalFilter.trim()
                      ? 'No errors matching your search.'
                      : 'No errors recorded in this period.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className='hover:bg-accent dark:hover:bg-primary/10 group cursor-pointer'
                  onClick={() =>
                    router.push(`/dashboard/${dashboardId}/errors/detail/${row.original.error_fingerprint}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as { cellClassName?: string } | undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        className={[
                          'text-muted-foreground px-3 py-3 text-sm sm:px-6',
                          meta?.cellClassName ?? '',
                        ].join(' ')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredCount > 0 && table.getPageCount() > 1 && (
        <PaginationControls
          pageIndex={table.getState().pagination.pageIndex}
          totalPages={table.getPageCount()}
          pageSize={pagination.pageSize}
          totalItems={filteredCount}
          onPageChange={(p) => table.setPageIndex(p)}
          onPageSizeChange={(size) => setPagination({ pageIndex: 0, pageSize: size })}
        />
      )}
    </div>
  );
}
