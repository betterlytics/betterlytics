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
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExpandedEventContent } from './ExpandedEventContent';
import { calculatePercentage } from '@/utils/mathUtils';
import { formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { fetchCustomEventsOverviewAction } from '@/app/actions/analytics/events.actions';
import { TableCompareCell } from '@/components/TableCompareCell';
import { useTranslations } from 'next-intl';
import { Stack, Inline } from '@/components/layout';
import { Text } from '@/components/text';

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
            <Inline gap='card'>
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
            </Inline>
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
        accessorFn: (row) => calculatePercentage(row.current.count, row.totalEvents),
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
          <Stack gap='card' className='items-center text-center'>
            <div className='bg-muted/30 inline-flex h-16 w-16 items-center justify-center rounded-full'>
              <Activity className='text-primary h-8 w-8' />
            </div>
            <Stack gap='minimal'>
              <Text variant='heading-sm'>{t('noEvents')}</Text>
              <Text variant='description' className='mx-auto max-w-sm leading-relaxed'>
                {t('noEventsDesc')}
              </Text>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/50 overflow-hidden px-3 sm:px-6'>
      <CardHeader className='px-0'>
        <CardTitle className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg'>
            <Activity className='text-primary h-4 w-4' />
          </div>
          <Inline gap='card'>
            <span>{t('eventDetails')}</span>
            <Badge variant='secondary' className='text-xs font-normal'>
              {data.length} {data.length === 1 ? t('uniqueEvent') : t('uniqueEvents')}
            </Badge>
          </Inline>
        </CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
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
                      <Inline align='center'>
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
                      </Inline>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className='divide-secondary divide-y'>
              {table.getRowModel().rows.map((row) => {
                const event = row.original;
                const isExpanded = event.isExpanded;

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      className={cn(
                        'hover:bg-accent/30 dark:hover:bg-accent/60 hover:ring-border/60 cursor-pointer transition-colors hover:ring-1',
                      )}
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
