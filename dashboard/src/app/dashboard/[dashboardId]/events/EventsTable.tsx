'use client';

import React, { useState, useMemo } from 'react';
import { Activity, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import {
  ColumnDef,
  SortingState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { EventTypeRow } from '@/entities/events';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExpandedEventContent } from './ExpandedEventContent';
import { calculatePercentage } from '@/utils/mathUtils';
import { formatTimeAgo } from '@/utils/dateFormatters';
import { formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { fetchCustomEventsOverviewAction } from '@/app/actions/events';
import { TableCompareCell } from '@/components/TableCompareCell';
import { useTranslations } from 'next-intl';

type TableEventRow = Awaited<ReturnType<typeof fetchCustomEventsOverviewAction>>[number];

interface EventsTableProps {
  data: TableEventRow[];
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

export function EventsTable({ data }: EventsTableProps) {
  const t = useTranslations('components.events.table');

  const { startDate, endDate } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();
  const [expandedRows, setExpandedRows] = useState<ExpandedRowState>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: 'count', desc: true }]);

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
      },
      {
        accessorKey: 'unique_users',
        header: t('uniqueUsers'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='unique_users' />,
        accessorFn: (row) => row.current.unique_users,
      },
      {
        accessorKey: 'avg_per_user',
        header: t('avgPerUser'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='avg_per_user' />,
        accessorFn: (row) => row.current.avg_per_user,
      },
      {
        accessorKey: 'last_seen',
        header: t('lastSeen'),
        cell: ({ row }) => {
          const timeAgo = formatTimeAgo(new Date(row.original.current.last_seen));

          return (
            <div className='flex items-center text-right text-sm'>
              <span className='text-muted-foreground'>{timeAgo}</span>
              <div className='ml-2 h-4 w-4' />
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.current.last_seen).getTime();
          const dateB = new Date(rowB.original.current.last_seen).getTime();
          return dateA - dateB;
        },
        accessorFn: (row) => new Date(row.current.last_seen).getTime(),
      },
      {
        id: 'percentage',
        header: t('percentage'),
        cell: ({ row }) => {
          const percentage = calculatePercentage(row.original.current.count, row.original.totalEvents);
          return (
            <div className='flex items-center text-right font-mono text-sm'>
              <span>{formatPercentage(percentage)}</span>
              <div className='ml-2 h-4 w-4' />
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const percentageA = calculatePercentage(rowA.original.current.count, rowA.original.totalEvents);
          const percentageB = calculatePercentage(rowB.original.current.count, rowB.original.totalEvents);
          return percentageA - percentageB;
        },
      },
    ],
    [t],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return (
      <Card className='border-border/50'>
        <CardContent className='p-12'>
          <div className='text-center'>
            <div className='bg-muted/30 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full'>
              <Activity className='text-primary h-8 w-8' />
            </div>
            <h3 className='text-foreground mb-3 text-lg font-semibold'>{t('noEvents')}</h3>
            <p className='text-muted-foreground mx-auto max-w-sm leading-relaxed'>{t('noEventsDesc')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/50 overflow-hidden'>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg'>
            <Activity className='text-primary h-4 w-4' />
          </div>
          <div className='flex items-center gap-3'>
            <span>{t('eventDetails')}</span>
            <Badge variant='secondary' className='text-xs font-normal'>
              {data.length} {data.length === 1 ? t('uniqueEvent') : t('uniqueEvents')}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <div className='overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700'>
          <Table>
            <TableHeader className='bg-gray-50 dark:bg-slate-800'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className='border-b border-gray-200 dark:border-slate-700'>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400',
                        header.column.getCanSort() &&
                          'cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-slate-700',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={cn('flex items-center')}>
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
            <TableBody className='divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900'>
              {table.getRowModel().rows.map((row) => {
                const event = row.original;
                const isExpanded = event.isExpanded;

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      className={cn(
                        'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50',
                        isExpanded && 'bg-primary/5',
                      )}
                      onClick={() => toggleRow(event.event_name)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className='px-4 py-3 text-sm text-slate-700 dark:text-slate-300'>
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
                            startDate={startDate}
                            endDate={endDate}
                            queryFilters={queryFilters}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
