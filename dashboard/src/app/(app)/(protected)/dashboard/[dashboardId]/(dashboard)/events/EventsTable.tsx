'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Activity, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  SortingState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PaginationControls } from '@/components/PaginationControls';
import { ExpandedEventContent } from './ExpandedEventContent';
import { calculatePercentage } from '@/utils/mathUtils';
import { formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { TableCompareCell } from '@/components/TableCompareCell';
import { useLocale, useTranslations } from 'next-intl';
import { BARouterOutputs } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';

type TableEventRow = BARouterOutputs['events']['customEventsOverview'][number];

const DEFAULT_PAGE_SIZE = 10;
const SKELETON_ROWS = DEFAULT_PAGE_SIZE;

export interface EventsTableProps {
  data: TableEventRow[];
  loading?: boolean;
  globalFilter?: string;
}

interface ExpandedRowState {
  [eventName: string]: {
    isExpanded: boolean;
    expandedProperties: Set<string>;
  };
}

interface EventRowWithExpansion extends TableEventRow {
  isExpanded: boolean;
  totalEvents: number;
}

const SKELETON_CELL_WIDTHS = ['w-3/5', 'w-16', 'w-16', 'w-16', 'w-20', 'w-12'];

function EventsTableSkeletonRow() {
  return (
    <TableRow>
      {SKELETON_CELL_WIDTHS.map((width) => (
        <TableCell key={width} className='px-4 py-3'>
          <Skeleton className={cn('h-4', width)} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function EventsTable({ data, loading, globalFilter = '' }: EventsTableProps) {
  const locale = useLocale();
  const t = useTranslations('components.events.table');

  const [expandedRows, setExpandedRows] = useState<ExpandedRowState>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: 'count', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });

  // Rows shift under the user when the page, sort order, or search changes;
  // collapse expansions and return to the first page to keep the view predictable.
  useEffect(() => {
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
    setExpandedRows({});
  }, [globalFilter]);

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    setPagination(updater);
    setExpandedRows({});
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting(updater);
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
    setExpandedRows({});
  };

  const totalEvents = data.reduce((sum, event) => sum + event.current.count, 0);

  const toggleRow = (eventName: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [eventName]: {
        isExpanded: !prev[eventName]?.isExpanded,
        expandedProperties: new Set(),
      },
    }));
  };

  const toggleProperty = (eventName: string, propertyName: string) => {
    setExpandedRows((prev) => {
      const currentState = prev[eventName] || { isExpanded: true, expandedProperties: new Set() };
      const newExpandedProperties = new Set(currentState.expandedProperties);

      if (newExpandedProperties.has(propertyName)) {
        newExpandedProperties.delete(propertyName);
      } else {
        newExpandedProperties.add(propertyName);
      }

      return {
        ...prev,
        [eventName]: {
          ...currentState,
          expandedProperties: newExpandedProperties,
        },
      };
    });
  };

  const tableData = useMemo(() => {
    return data.map((event) => ({
      ...event,
      isExpanded: expandedRows[event.current.event_name]?.isExpanded || false,
      totalEvents,
    }));
  }, [data, expandedRows, totalEvents]);

  const columns: ColumnDef<EventRowWithExpansion>[] = useMemo(
    () => [
      {
        accessorKey: 'event_name',
        header: t('eventName'),
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div className='flex items-center gap-3'>
              <div className='flex h-4 w-4 items-center justify-center'>
                {event.isExpanded ? (
                  <ChevronDown className='text-primary h-4 w-4' />
                ) : (
                  <ChevronRight className='text-muted-foreground h-4 w-4' />
                )}
              </div>
              <span
                className={cn(
                  'font-medium transition-colors duration-100',
                  event.isExpanded ? 'text-primary' : 'text-foreground',
                )}
              >
                {event.event_name}
              </span>
            </div>
          );
        },
        accessorFn: (row) => row.current.event_name,
      },
      {
        accessorKey: 'count',
        header: t('count'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='count' />,
        accessorFn: (row) => row.current.count,
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'unique_users',
        header: t('uniqueUsers'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='unique_users' />,
        accessorFn: (row) => row.current.unique_users,
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'avg_per_user',
        header: t('avgPerUser'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='avg_per_user' />,
        accessorFn: (row) => row.current.avg_per_user,
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'last_seen',
        header: t('lastSeen'),
        cell: ({ row }) => {
          const timeAgo = formatRelativeTimeFromNow(row.original.current.last_seen);
          return (
            <div className='flex items-center text-right text-sm'>
              <span className='text-muted-foreground'>{timeAgo}</span>
              <div className='ml-2 h-4 w-4' />
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.original.current.last_seen.getTime();
          const dateB = rowB.original.current.last_seen.getTime();
          return dateA - dateB;
        },
        accessorFn: (row) => row.current.last_seen.getTime(),
        enableGlobalFilter: false,
      },
      {
        id: 'percentage',
        header: t('percentage'),
        cell: ({ row }) => {
          const percentage = calculatePercentage(row.original.current.count, row.original.totalEvents);
          return (
            <div className='flex items-center text-right font-mono text-sm'>
              <span>{formatPercentage(percentage, locale)}</span>
              <div className='ml-2 h-4 w-4' />
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const percentageA = calculatePercentage(rowA.original.current.count, rowA.original.totalEvents);
          const percentageB = calculatePercentage(rowB.original.current.count, rowB.original.totalEvents);
          return percentageA - percentageB;
        },
        accessorFn: (row) => calculatePercentage(row.current.count, row.totalEvents),
        enableGlobalFilter: false,
      },
    ],
    [t, locale],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    autoResetPageIndex: false,
  });

  if (!loading && data.length === 0) {
    return (
      <div className='p-12 text-center'>
        <div className='bg-muted/30 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full'>
          <Activity className='text-primary h-8 w-8' />
        </div>
        <h3 className='text-foreground mb-3 text-lg font-semibold'>{t('noEvents')}</h3>
        <p className='text-muted-foreground mx-auto max-w-sm leading-relaxed'>{t('noEventsDesc')}</p>
      </div>
    );
  }

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows;

  return (
    <div className='space-y-3'>
      <div className='dark:border-secondary overflow-hidden rounded-lg border border-gray-200 dark:border-2'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='border-muted-foreground bg-accent hover:bg-accent border-b'
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-foreground bg-muted/50 px-4 py-3 text-left text-sm font-medium',
                      header.column.getCanSort()
                        ? 'hover:!bg-input/40 dark:hover:!bg-accent cursor-pointer select-none'
                        : '',
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className='flex items-center'>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <div className='ml-2 flex h-4 w-4 items-center justify-center'>
                          {header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown className='size-4' />
                          ) : header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp className='size-4' />
                          ) : (
                            <div className='size-4' />
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className='divide-secondary divide-y'>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }, (_, i) => <EventsTableSkeletonRow key={i} />)
            ) : pageRows.length === 0 ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={columns.length} className='py-12 text-center'>
                  <p className='text-muted-foreground text-sm'>{t('emptySearch')}</p>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const event = row.original;
                const isExpanded = event.isExpanded;

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      className='hover:bg-accent/30 dark:hover:bg-accent/60 hover:ring-border/60 cursor-pointer transition-colors hover:ring-1'
                      onClick={() => toggleRow(event.event_name)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className='text-foreground px-4 py-3 text-sm'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>

                    {isExpanded && (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell colSpan={columns.length}>
                          <ExpandedEventContent
                            event={event.current}
                            expandedProperties={expandedRows[event.event_name]?.expandedProperties || new Set()}
                            onToggleProperty={(propertyName) => toggleProperty(event.event_name, propertyName)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && filteredCount > 0 && table.getPageCount() > 1 && (
        <PaginationControls
          pageIndex={table.getState().pagination.pageIndex}
          totalPages={table.getPageCount()}
          pageSize={pagination.pageSize}
          totalItems={filteredCount}
          onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
          onPageSizeChange={(size) => handlePaginationChange({ pageIndex: 0, pageSize: size })}
        />
      )}
    </div>
  );
}
