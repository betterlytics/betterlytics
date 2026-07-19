'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { ArrowDown, ArrowUp, Check, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatElapsedTime, formatLocalDateTime } from '@/utils/dateFormatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaginationControls } from '@/components/PaginationControls';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import {
  type DetectedOutageSuggestion,
  type StatusPageIncident,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { IMPACT_BADGE, statusBadgeClass } from '@/components/statusPage/incidentToneStyles';
import {
  deleteStatusPageIncidentAction,
  fetchIncidentSuggestionsAction,
  fetchStatusPageIncidentsAction,
} from '@/app/actions/analytics/statusPage.actions';
import {
  IncidentEditorSheet,
  editorSeedForCreate,
  editorSeedForIncident,
  editorSeedForSuggestion,
  type IncidentEditorSeed,
  type MonitorOption,
} from './IncidentEditorSheet';
import { IncidentSuggestionsPanel } from './IncidentSuggestionsPanel';
import { MonitorPills } from './MonitorPills';
import { Section } from './Section';

type IncidentsTabProps = {
  dashboardId: string;
  statusPageId: string;
  monitors: MonitorOption[];
};

const PAGE_SIZE = 10;

type StateFilter = 'all' | 'active' | 'resolved';

type IncidentColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
  stopRowClick?: boolean;
};

export function IncidentsTab({ dashboardId, statusPageId, monitors }: IncidentsTabProps) {
  const t = useTranslations('statusPagesPage.editor.incidents');
  const locale = useLocale() as SupportedLanguages;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canMutate } = useDashboardAuth();

  // The editor sheet initializes from its seed on mount; a fresh key per open remounts it,
  // so opening never has to reset stale state field by field.
  const [editor, setEditor] = useState<{ seed: IncidentEditorSeed; key: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const openEditor = useCallback((seed: IncidentEditorSeed) => {
    setEditor((prev) => ({ seed, key: (prev?.key ?? 0) + 1 }));
    setEditorOpen(true);
  }, []);

  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'started', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  const incidentsKey = ['statusPageIncidents', statusPageId];
  const suggestionsKey = ['statusPageIncidentSuggestions', statusPageId];

  const incidentsQuery = useQuery({
    queryKey: incidentsKey,
    queryFn: () => fetchStatusPageIncidentsAction(dashboardId, statusPageId),
  });
  const suggestionsQuery = useQuery({
    queryKey: suggestionsKey,
    queryFn: () => fetchIncidentSuggestionsAction(dashboardId, statusPageId),
  });

  const afterMutation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['statusPageIncidents', statusPageId] });
    queryClient.invalidateQueries({ queryKey: ['statusPageIncidentSuggestions', statusPageId] });
    queryClient.invalidateQueries({ queryKey: ['statusPageIncidentTimeline', statusPageId] });
    router.refresh(); // keep the live preview / public page in sync
  }, [queryClient, router, statusPageId]);

  const deleteMutation = useMutation({
    mutationFn: (incidentId: string) => deleteStatusPageIncidentAction(dashboardId, statusPageId, incidentId),
    onSuccess: () => {
      afterMutation();
      toast.success(t('deleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });
  // Destructured so the columns memo can depend on the stable pieces, not the whole mutation object.
  const { mutate: deleteIncident, isPending: isDeletingIncident } = deleteMutation;

  const openCreate = () => openEditor(editorSeedForCreate());

  const openEdit = useCallback(
    (incident: StatusPageIncident) => openEditor(editorSeedForIncident(incident)),
    [openEditor],
  );

  const openFromSuggestion = (suggestion: DetectedOutageSuggestion) => {
    const title =
      suggestion.monitors.length === 1
        ? t('suggestedTitle', { monitor: suggestion.monitors[0].monitorPublicName })
        : t('suggestedTitleMulti', { count: suggestion.monitors.length });
    openEditor(editorSeedForSuggestion(suggestion, title));
  };

  const incidents = useMemo(() => incidentsQuery.data ?? [], [incidentsQuery.data]);
  const suggestions = suggestionsQuery.data ?? [];
  const isLoading = incidentsQuery.isLoading;
  const isEmpty = !isLoading && incidents.length === 0;

  const monitorNameById = useMemo(
    () => new Map(monitors.map((monitor) => [monitor.monitorCheckId, monitor.publicName])),
    [monitors],
  );

  const affectedNames = useCallback(
    (incident: StatusPageIncident): string[] =>
      incident.monitorCheckIds.map((id) => monitorNameById.get(id)).filter((name): name is string => name != null),
    [monitorNameById],
  );

  const affectedLabel = useCallback(
    (incident: StatusPageIncident): string => {
      const names = affectedNames(incident);
      return names.length > 0 ? names.join(', ') : t('unspecified');
    },
    [affectedNames, t],
  );

  const startedLabel = useCallback(
    (incident: StatusPageIncident): string =>
      formatLocalDateTime(incident.startedAt, locale, { month: 'short', day: 'numeric', year: 'numeric' }) ?? '',
    [locale],
  );

  const durationMsOf = useCallback(
    (incident: StatusPageIncident): number =>
      incident.resolvedAt
        ? new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()
        : Date.now() - new Date(incident.startedAt).getTime(),
    [],
  );

  const durationLabel = useCallback(
    (incident: StatusPageIncident): string => {
      if (incident.resolvedAt) {
        return t('lasted', { duration: formatElapsedTime(new Date(Date.now() - durationMsOf(incident)), locale) });
      }
      return t('ongoingFor', { duration: formatElapsedTime(new Date(incident.startedAt), locale) });
    },
    [durationMsOf, locale, t],
  );

  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        const isActive = incident.resolvedAt == null;
        if (stateFilter === 'active' && !isActive) return false;
        if (stateFilter === 'resolved' && isActive) return false;
        return true;
      }),
    [incidents, stateFilter],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGlobalFilter(searchInput);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [stateFilter]);

  const columns = useMemo<ColumnDef<StatusPageIncident, unknown>[]>(
    () => [
      {
        id: 'incident',
        accessorFn: (row) => `${row.title} ${row.description ?? ''} ${row.body}`,
        header: t('table.incident'),
        enableSorting: false,
        meta: { cellClassName: 'w-full max-w-0 min-w-[140px] sm:min-w-[200px]' } satisfies IncidentColumnMeta,
        cell: ({ row }) => {
          const incident = row.original;
          return (
            <div className='min-w-0'>
              <div className='flex items-center gap-2'>
                <span className='text-foreground truncate text-sm font-medium'>{incident.title}</span>
                {incident.detectedIncidentId && (
                  <span className='border-border text-muted-foreground inline-flex flex-none items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium'>
                    <Sparkles className='h-2.5 w-2.5' />
                    {t('autoDetected')}
                  </span>
                )}
              </div>
              {(incident.description || incident.body) && (
                <div className='text-muted-foreground truncate text-xs'>
                  {incident.description || incident.body}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'impact',
        accessorFn: (row) => row.impact,
        header: t('table.impact'),
        enableSorting: false,
        enableGlobalFilter: false,
        meta: {
          cellClassName: 'hidden md:table-cell',
          headerClassName: 'hidden px-3 sm:px-6 md:table-cell',
        } satisfies IncidentColumnMeta,
        cell: ({ row }) => (
          <Badge variant='outline' className={IMPACT_BADGE[row.original.impact]}>
            {t(`impact.${row.original.impact}`)}
          </Badge>
        ),
      },
      {
        id: 'affected',
        accessorFn: (row) => affectedLabel(row),
        header: t('table.affected'),
        enableSorting: false,
        meta: {
          cellClassName: 'hidden lg:table-cell',
          headerClassName: 'hidden px-3 sm:px-6 lg:table-cell',
        } satisfies IncidentColumnMeta,
        cell: ({ row }) => {
          const names = affectedNames(row.original);
          if (names.length === 0) {
            return <span className='text-muted-foreground'>{t('unspecified')}</span>;
          }
          return <MonitorPills names={names} />;
        },
      },
      {
        id: 'started',
        accessorFn: (row) => new Date(row.startedAt).getTime(),
        header: t('table.started'),
        enableGlobalFilter: false,
        meta: {
          cellClassName: 'hidden sm:table-cell',
          headerClassName: 'hidden px-3 sm:table-cell sm:px-6',
        } satisfies IncidentColumnMeta,
        cell: ({ row }) => <span suppressHydrationWarning>{startedLabel(row.original)}</span>,
      },
      {
        id: 'duration',
        accessorFn: (row) => durationMsOf(row),
        header: t('table.duration'),
        enableGlobalFilter: false,
        meta: {
          cellClassName: 'hidden xl:table-cell',
          headerClassName: 'hidden px-3 sm:px-6 xl:table-cell',
        } satisfies IncidentColumnMeta,
        cell: ({ row }) => <span suppressHydrationWarning>{durationLabel(row.original)}</span>,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: t('table.status'),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <Badge variant='outline' className={statusBadgeClass(row.original.status)}>
            {t(`status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableGlobalFilter: false,
        meta: {
          cellClassName: 'w-10 pr-2 sm:pr-4',
          headerClassName: 'w-10',
          stopRowClick: true,
        } satisfies IncidentColumnMeta,
        cell: ({ row }) => {
          const incident = row.original;
          return (
            <PermissionGate hideWhenDisabled>
              {() => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size='icon'
                      variant='ghost'
                      disabled={isDeletingIncident}
                      aria-label={t('actions')}
                      className='text-muted-foreground hover:text-foreground h-7 w-7 cursor-pointer focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => openEdit(incident)} className='cursor-pointer'>
                      <Pencil className='h-3.5 w-3.5' />
                      {t('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => deleteIncident(incident.id)}
                      className='cursor-pointer'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                      {t('delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </PermissionGate>
          );
        },
      },
    ],
    [
      t,
      affectedNames,
      affectedLabel,
      startedLabel,
      durationMsOf,
      durationLabel,
      openEdit,
      deleteIncident,
      isDeletingIncident,
    ],
  );

  const table = useReactTable({
    data: filteredIncidents,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
  });

  const visibleRows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const columnCount = table.getVisibleLeafColumns().length;
  const hasActiveFilters = globalFilter.trim().length > 0 || stateFilter !== 'all';

  return (
    <div className='space-y-4'>
      <IncidentSuggestionsPanel suggestions={suggestions} onCreateIncident={openFromSuggestion} />

      <Section
        title={t('title')}
        aside={
          <div className='flex flex-wrap items-center gap-2 sm:justify-end'>
            {!isEmpty && (
              <>
                <div className='relative w-full sm:w-48'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    type='text'
                    placeholder={t('filters.search')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className='h-8 pl-9'
                  />
                </div>
                <Select value={stateFilter} onValueChange={(v) => setStateFilter(v as StateFilter)}>
                  <SelectTrigger size='sm' className='w-[130px]' aria-label={t('filters.state')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('filters.stateAll')}</SelectItem>
                    <SelectItem value='active'>{t('filters.stateActive')}</SelectItem>
                    <SelectItem value='resolved'>{t('filters.stateResolved')}</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            <PermissionGate>
              {(disabled) => (
                <Button size='sm' disabled={disabled} onClick={openCreate} className='flex-none cursor-pointer'>
                  <Plus className='mr-1 h-4 w-4' />
                  {t('newIncident')}
                </Button>
              )}
            </PermissionGate>
          </div>
        }
      >
        {isEmpty ? (
          <div className='bg-card border-border overflow-hidden rounded-xl border'>
            <div className='flex flex-col items-center justify-center px-6 py-16 text-center'>
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full',
                  suggestions.length === 0
                    ? 'bg-emerald-500 text-white ring-8 ring-emerald-500/15'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Check className='h-5 w-5' strokeWidth={3} />
              </span>
              <p className='text-foreground mt-5 text-sm font-medium'>{t('noIncidents')}</p>
              <p className='text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed'>{t('emptyHint')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className='border-border overflow-x-auto rounded-lg border'>
              <Table className='min-w-0 sm:min-w-[600px] md:min-w-[720px] lg:min-w-[880px] xl:min-w-[920px]'>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className='border-muted-foreground bg-accent hover:bg-accent border-b'
                    >
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const sorted = header.column.getIsSorted();
                        const meta = header.column.columnDef.meta as IncidentColumnMeta | undefined;
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
                            <div className='flex items-center gap-1'>
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
                  {isLoading ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i} className='hover:bg-transparent'>
                        <TableCell colSpan={columnCount} className='px-3 py-3.5 sm:px-6'>
                          <Skeleton className='h-5 w-full' />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredCount === 0 ? (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={columnCount} className='py-12 text-center'>
                        <p className='text-muted-foreground text-sm'>
                          {hasActiveFilters ? t('filters.noMatch') : t('noIncidents')}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row) => (
                      <TableRow
                        key={row.id}
                        tabIndex={canMutate ? 0 : undefined}
                        className={cn(
                          'group',
                          canMutate &&
                            'hover:bg-accent dark:hover:bg-primary/10 focus-visible:bg-accent dark:focus-visible:bg-primary/10 focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none',
                        )}
                        onClick={canMutate ? () => openEdit(row.original) : undefined}
                        onKeyDown={
                          canMutate
                            ? (e) => {
                                if (e.target !== e.currentTarget) return;
                                if (e.key !== 'Enter' && e.key !== ' ') return;
                                e.preventDefault();
                                openEdit(row.original);
                              }
                            : undefined
                        }
                      >
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as IncidentColumnMeta | undefined;
                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                'text-muted-foreground px-3 py-3 text-sm sm:px-6',
                                meta?.cellClassName,
                              )}
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
          </>
        )}
      </Section>

      {editor && (
        <IncidentEditorSheet
          key={editor.key}
          dashboardId={dashboardId}
          statusPageId={statusPageId}
          monitors={monitors}
          seed={editor.seed}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onMutated={afterMutation}
          onDelete={deleteIncident}
          deleting={isDeletingIncident}
        />
      )}
    </div>
  );
}
