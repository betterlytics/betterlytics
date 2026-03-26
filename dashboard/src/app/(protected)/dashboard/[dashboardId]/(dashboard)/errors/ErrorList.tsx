'use client';

import { useState, useMemo, useRef, useTransition, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import {
  Search,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  EyeOff,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
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
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { PaginationControls } from '@/components/PaginationControls';
import { ErrorSparklineChart } from './ErrorSparklineChart';
import { fetchErrorGroupVolumesAction } from '@/app/actions/analytics/errors.actions';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';
import { useErrorGroupActions, type StatusFilter } from './use-error-group-actions';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import { formatElapsedTime } from '@/utils/dateFormatters';
import type { TimeSeriesPoint } from '@/presenters/toTimeSeries';
import { formatNumber } from '@/utils/formatters';
import type { ErrorGroupRow, ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';
import { STATUS_CONFIG } from './errors.constants';
import { cn } from '@/lib/utils';
import { ErrorTestScript } from './ErrorTestScript';

const RECENT_THRESHOLD_MS = 60 * 60 * 1000;
const PAGE_SIZE = 10;

const STATUS_FILTER_KEYS: StatusFilter[] = ['all', 'unresolved', 'resolved', 'ignored'];

function StatusFilterTabs({
  value,
  counts,
  onChange,
}: {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (filter: StatusFilter) => void;
}) {
  const t = useTranslations('errors.statusFilter');
  return (
    <div className='border-border flex gap-1 border-b'>
      {STATUS_FILTER_KEYS.map((key) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type='button'
            onClick={() => onChange(key)}
            className={cn(
              '-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            {t(key)}
            <span
              className={cn(
                'ml-1.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                isActive ? 'bg-primary/10 text-foreground' : 'bg-muted text-muted-foreground',
              )}
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

  const t = useTranslations('errors.toolbar');
  return (
    <div className='flex items-center gap-3'>
      <div className='relative max-w-sm flex-1'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <Input
          type='text'
          placeholder={t('searchPlaceholder')}
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-9'
        />
      </div>
      <div className='ml-auto flex items-center gap-2'>
        {hasSelection && (
          <span className='text-muted-foreground text-sm'>{t('selectedCount', { count: selectedCount })}</span>
        )}
        <PermissionGate>
          {(disabled) => (
            <ErrorStatusActions
              canResolve={canResolve && !disabled}
              canIgnore={canIgnore && !disabled}
              canUnresolve={canUnresolve && !disabled}
              onResolve={onResolve}
              onIgnore={onIgnore}
              onUnresolve={onUnresolve}
              isPending={disabled}
            />
          )}
        </PermissionGate>
        <PermissionGate allowViewer>
          {(disabled) => (
            <Button
              variant='outline'
              size='sm'
              className='shrink-0 cursor-pointer'
              disabled={isRefreshing || disabled}
              onClick={onReload}
              aria-label={t('reloadAria')}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              {t('reload')}
            </Button>
          )}
        </PermissionGate>
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
  const t = useTranslations('errors');
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const { resolveHref } = useDashboardNavigation();
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
        meta: {
          cellClassName: 'w-10 py-3 pl-4 sm:pl-6',
          headerClassName: 'w-10 pl-4 sm:pl-6',
          stopRowClick: true,
        },
        header: ({ table }) => (
          <PermissionGate>
            {(disabled) => (
              <Checkbox
                checked={
                  !disabled &&
                  (table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'))
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                className={cn('mr-2', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}
                disabled={disabled}
                aria-label={t('table.selectAll')}
              />
            )}
          </PermissionGate>
        ),
        cell: ({ row }) => (
          <PermissionGate>
            {(disabled) => (
              <Checkbox
                className={cn(disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}
                checked={!disabled && row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                onClick={(e) => e.stopPropagation()}
                disabled={disabled}
                aria-label={t('table.selectRow')}
              />
            )}
          </PermissionGate>
        ),
        enableSorting: false,
      },
      {
        id: 'error',
        accessorFn: (row) => `${row.error_type} ${row.error_message}`,
        header: t('table.columns.error'),
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
        header: t('table.columns.volume'),
        meta: { cellClassName: 'hidden xl:table-cell', headerClassName: 'hidden xl:table-cell' },
        cell: ({ row }) => (
          <ErrorSparklineChart data={volumeMapRef.current?.[row.original.error_fingerprint] ?? []} />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'count',
        header: t('table.columns.occurrences'),
        enableGlobalFilter: false,
        meta: { centered: true },
        cell: ({ getValue }) => (
          <div className='text-center tabular-nums'>{formatNumber(getValue() as number)}</div>
        ),
      },
      {
        accessorKey: 'session_count',
        header: t('table.columns.sessions'),
        enableGlobalFilter: false,
        meta: { centered: true },
        cell: ({ getValue }) => (
          <div className='text-center tabular-nums'>{formatNumber(getValue() as number)}</div>
        ),
      },
      {
        id: 'first_seen',
        accessorFn: (row) => (row.first_seen ? new Date(row.first_seen).getTime() : 0),
        header: t('table.columns.firstSeen'),
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const firstSeen = row.original.first_seen;
          return firstSeen ? t('table.ago', { time: formatElapsedTime(new Date(firstSeen)) }) : '—';
        },
      },
      {
        id: 'last_seen',
        accessorFn: (row) => (row.last_seen ? new Date(row.last_seen).getTime() : 0),
        header: t('table.columns.lastSeen'),
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const lastSeen = row.original.last_seen;
          if (!lastSeen) return '—';
          const lastSeenDate = new Date(lastSeen);
          const isRecent = Date.now() - lastSeenDate.getTime() < RECENT_THRESHOLD_MS;
          return (
            <div className='flex items-center gap-1.5'>
              {isRecent && <span className='bg-destructive h-1.5 w-1.5 shrink-0 animate-pulse rounded-full' />}
              {t('table.ago', { time: formatElapsedTime(lastSeenDate) })}
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: t('table.columns.status'),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const status = getStatus(row.original.error_fingerprint, row.original.status);
          const cfg = STATUS_CONFIG[status];
          return (
            <Badge variant='outline' className={cfg.className}>
              {t(`status.${status}`)}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        meta: { cellClassName: 'w-10 pr-2 sm:pr-4', headerClassName: 'w-10', stopRowClick: true },
        enableSorting: false,
        cell: ({ row }) => {
          const fp = row.original.error_fingerprint;
          const currentStatus = getStatus(fp, row.original.status);
          return (
            <PermissionGate hideWhenDisabled>
              {() => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 cursor-pointer focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                      onClick={(e) => e.stopPropagation()}
                      aria-label={t('table.rowActionsAria')}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {currentStatus !== 'resolved' && (
                      <DropdownMenuItem className='cursor-pointer' onClick={() => setStatus(fp, 'resolved')}>
                        <CheckCircle className='mr-2 h-4 w-4 text-emerald-600' />
                        {t('statusActions.markResolved')}
                      </DropdownMenuItem>
                    )}
                    {currentStatus !== 'ignored' && (
                      <DropdownMenuItem className='cursor-pointer' onClick={() => setStatus(fp, 'ignored')}>
                        <EyeOff className='mr-2 h-4 w-4' />
                        {t('statusActions.ignore')}
                      </DropdownMenuItem>
                    )}
                    {currentStatus !== 'unresolved' && (
                      <DropdownMenuItem className='cursor-pointer' onClick={() => setStatus(fp, 'unresolved')}>
                        <RotateCcw className='mr-2 h-4 w-4' />
                        {t('statusActions.markUnresolved')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </PermissionGate>
          );
        },
      },
    ],
    [getStatus, t],
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
                      className={cn(
                        'text-foreground bg-muted/50 py-3 text-sm font-medium',
                        meta?.headerClassName ?? 'px-3 sm:px-6',
                        canSort && 'hover:!bg-input/40 dark:hover:!bg-accent cursor-pointer select-none',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={cn('flex items-center gap-1', meta?.centered && 'justify-center')}>
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
                    {globalFilter.trim() ? t('table.emptySearch') : t('table.emptyPeriod')}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className='hover:bg-accent dark:hover:bg-primary/10 group cursor-pointer'
                  onClick={(e) => {
                    const href = resolveHref(`/errors/detail/${row.original.error_fingerprint}`);
                    if (e.metaKey || e.ctrlKey) {
                      window.open(href, '_blank');
                    } else {
                      router.push(href);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { cellClassName?: string; stopRowClick?: boolean }
                      | undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn('text-muted-foreground px-3 py-3 text-sm sm:px-6', meta?.cellClassName)}
                        onClick={meta?.stopRowClick ? (e) => e.stopPropagation() : undefined}
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
