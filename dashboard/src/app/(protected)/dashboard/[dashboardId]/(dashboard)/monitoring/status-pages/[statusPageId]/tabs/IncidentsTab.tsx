'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Check,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatElapsedTime, formatLocalDateTime, formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaginationControls } from '@/components/PaginationControls';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import {
  type DetectedOutageSuggestion,
  type StatusPageIncident,
  type StatusPageIncidentImpact,
  type StatusPageIncidentStatusValue,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';
import {
  createStatusPageIncidentAction,
  deleteStatusPageIncidentAction,
  fetchIncidentSuggestionsAction,
  fetchStatusPageIncidentsAction,
  setStatusPageIncidentPublishedAction,
  updateStatusPageIncidentAction,
} from '@/app/actions/analytics/statusPage.actions';

type MonitorOption = { monitorCheckId: string; publicName: string };

type IncidentsTabProps = {
  dashboardId: string;
  statusPageId: string;
  monitors: MonitorOption[];
};

const PAGE_SIZE = 10;

const IMPACTS: StatusPageIncidentImpact[] = ['degraded', 'outage'];
const STATUSES: StatusPageIncidentStatusValue[] = ['investigating', 'identified', 'monitoring', 'resolved'];

// "Active" = still ongoing (no resolved timestamp); "Resolved" = has one. These replace the old
// active/past section split with a single filterable dimension.
type StateFilter = 'all' | 'active' | 'resolved';
type VisibilityFilter = 'all' | 'published' | 'internal';

// Outline badges per lifecycle status — mirrors the errors table's status badges.
const STATUS_BADGE: Record<StatusPageIncidentStatusValue, string> = {
  investigating: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  identified: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  monitoring: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  resolved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const IMPACT_BADGE: Record<StatusPageIncidentImpact, string> = {
  degraded: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  outage: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

// Impact selector in the modal: muted by default, tinted when picked.
const IMPACT_SELECTED: Record<StatusPageIncidentImpact, string> = {
  degraded: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  outage: 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

type IncidentColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
  stopRowClick?: boolean;
};

type IncidentForm = {
  id: string | null;
  detectedIncidentId: string | null;
  title: string;
  body: string;
  impact: StatusPageIncidentImpact;
  status: StatusPageIncidentStatusValue;
  monitorCheckId: string | null;
  startedAtLocal: string;
  resolvedAtLocal: string;
  isPublished: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(): IncidentForm {
  return {
    id: null,
    detectedIncidentId: null,
    title: '',
    body: '',
    impact: 'outage',
    status: 'investigating',
    monitorCheckId: null,
    startedAtLocal: toLocalInput(new Date()),
    resolvedAtLocal: '',
    isPublished: false,
  };
}

export function IncidentsTab({ dashboardId, statusPageId, monitors }: IncidentsTabProps) {
  const t = useTranslations('statusPagesPage.editor.incidents');
  const locale = useLocale() as SupportedLanguages;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<IncidentForm>(emptyForm);

  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
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

  const afterMutation = () => {
    queryClient.invalidateQueries({ queryKey: incidentsKey });
    queryClient.invalidateQueries({ queryKey: suggestionsKey });
    router.refresh(); // keep the live preview / public page in sync
  };

  const saveMutation = useMutation({
    mutationFn: async (values: IncidentForm) => {
      const startedAt = new Date(values.startedAtLocal);
      const resolvedAt = values.resolvedAtLocal ? new Date(values.resolvedAtLocal) : null;
      if (values.id) {
        return updateStatusPageIncidentAction(dashboardId, {
          id: values.id,
          statusPageId,
          title: values.title.trim(),
          body: values.body.trim(),
          impact: values.impact,
          status: values.status,
          monitorCheckId: values.monitorCheckId,
          startedAt,
          resolvedAt,
          isPublished: values.isPublished,
        });
      }
      return createStatusPageIncidentAction(dashboardId, {
        statusPageId,
        title: values.title.trim(),
        body: values.body.trim(),
        impact: values.impact,
        status: values.status,
        monitorCheckId: values.monitorCheckId,
        detectedIncidentId: values.detectedIncidentId,
        startedAt,
        resolvedAt,
        isPublished: values.isPublished,
      });
    },
    onSuccess: () => {
      setOpen(false);
      afterMutation();
      toast.success(t('saved'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const publishMutation = useMutation({
    mutationFn: ({ incidentId, isPublished }: { incidentId: string; isPublished: boolean }) =>
      setStatusPageIncidentPublishedAction(dashboardId, statusPageId, incidentId, isPublished),
    onSuccess: () => afterMutation(),
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (incidentId: string) => deleteStatusPageIncidentAction(dashboardId, statusPageId, incidentId),
    onSuccess: () => {
      afterMutation();
      toast.success(t('deleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (incident: StatusPageIncident) => {
    setForm({
      id: incident.id,
      detectedIncidentId: incident.detectedIncidentId,
      title: incident.title,
      body: incident.body,
      impact: incident.impact,
      status: incident.status,
      monitorCheckId: incident.monitorCheckId,
      startedAtLocal: toLocalInput(new Date(incident.startedAt)),
      resolvedAtLocal: incident.resolvedAt ? toLocalInput(new Date(incident.resolvedAt)) : '',
      isPublished: incident.isPublished,
    });
    setOpen(true);
  };

  const openFromSuggestion = (suggestion: DetectedOutageSuggestion) => {
    setForm({
      ...emptyForm(),
      detectedIncidentId: suggestion.detectedIncidentId,
      title: t('suggestedTitle', { monitor: suggestion.monitorPublicName }),
      impact: suggestion.suggestedImpact,
      status: suggestion.ongoing ? 'investigating' : 'resolved',
      monitorCheckId: suggestion.monitorCheckId,
      startedAtLocal: toLocalInput(new Date(suggestion.startedAt)),
      resolvedAtLocal: suggestion.resolvedAt ? toLocalInput(new Date(suggestion.resolvedAt)) : '',
    });
    setOpen(true);
  };

  const incidents = useMemo(() => incidentsQuery.data ?? [], [incidentsQuery.data]);
  const suggestions = suggestionsQuery.data ?? [];
  const isLoading = incidentsQuery.isLoading;
  const isRefreshing = incidentsQuery.isFetching || suggestionsQuery.isFetching;

  const monitorNameById = useMemo(
    () => new Map(monitors.map((monitor) => [monitor.monitorCheckId, monitor.publicName])),
    [monitors],
  );

  const affectedLabel = (incident: StatusPageIncident): string => {
    if (incident.monitorCheckId == null) return t('pageWide');
    return monitorNameById.get(incident.monitorCheckId) ?? '—';
  };

  const startedLabel = (incident: StatusPageIncident): string =>
    formatLocalDateTime(incident.startedAt, locale, { month: 'short', day: 'numeric', year: 'numeric' }) ?? '';

  // Compact "2d 14h" / "45m" duration: elapsed-since-start for ongoing, fixed span for resolved.
  const durationMsOf = (incident: StatusPageIncident): number =>
    incident.resolvedAt
      ? new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()
      : Date.now() - new Date(incident.startedAt).getTime();

  const durationLabel = (incident: StatusPageIncident): string => {
    if (incident.resolvedAt) {
      return t('lasted', { duration: formatElapsedTime(new Date(Date.now() - durationMsOf(incident)), locale) });
    }
    return t('ongoingFor', { duration: formatElapsedTime(new Date(incident.startedAt), locale) });
  };

  // Pre-filter by the State / Visibility selects before the table applies search + sort.
  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        const isActive = incident.resolvedAt == null;
        if (stateFilter === 'active' && !isActive) return false;
        if (stateFilter === 'resolved' && isActive) return false;
        if (visibilityFilter === 'published' && !incident.isPublished) return false;
        if (visibilityFilter === 'internal' && incident.isPublished) return false;
        return true;
      }),
    [incidents, stateFilter, visibilityFilter],
  );

  // Debounce the search box, and reset to the first page whenever it changes.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setGlobalFilter(searchInput);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [stateFilter, visibilityFilter]);

  const columns = useMemo<ColumnDef<StatusPageIncident, unknown>[]>(
    () => [
      {
        id: 'incident',
        accessorFn: (row) => `${row.title} ${row.body}`,
        header: t('table.incident'),
        enableSorting: false,
        meta: { cellClassName: 'w-full max-w-0 min-w-[200px]' } satisfies IncidentColumnMeta,
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
              {incident.body && <div className='text-muted-foreground truncate text-xs'>{incident.body}</div>}
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
          const incident = row.original;
          // Page-wide incidents have no monitor — kept as plain text rather than a pill.
          if (incident.monitorCheckId == null) {
            return <span className='text-muted-foreground'>{t('pageWide')}</span>;
          }
          // One monitor per incident today; rendered as a capped pill list so multi-monitor
          // support would be a drop-in here (the "+N more" pill stays dormant until then).
          const names = [monitorNameById.get(incident.monitorCheckId) ?? '—'];
          const MAX_PILLS = 2;
          const shown = names.slice(0, MAX_PILLS);
          const overflow = names.length - shown.length;
          return (
            <div className='flex min-w-0 flex-wrap items-center gap-1'>
              {shown.map((name, i) => (
                <Badge key={i} variant='secondary' className='max-w-[200px] font-normal'>
                  <span className='min-w-0 truncate'>{name}</span>
                </Badge>
              ))}
              {overflow > 0 && (
                <Badge variant='outline' className='border-border text-muted-foreground font-normal'>
                  {t('affectedMore', { count: overflow })}
                </Badge>
              )}
            </div>
          );
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
        id: 'visibility',
        accessorFn: (row) => row.isPublished,
        header: t('table.visibility'),
        enableSorting: false,
        enableGlobalFilter: false,
        meta: {
          cellClassName: 'hidden lg:table-cell',
          headerClassName: 'hidden px-3 sm:px-6 lg:table-cell',
        } satisfies IncidentColumnMeta,
        cell: ({ row }) =>
          row.original.isPublished ? (
            <Badge variant='outline' className='border-border text-muted-foreground'>
              {t('published')}
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            >
              <Lock className='mr-1 h-3 w-3' />
              {t('internal')}
            </Badge>
          ),
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: t('table.status'),
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <Badge variant='outline' className={STATUS_BADGE[row.original.status]}>
            {t(`status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableGlobalFilter: false,
        meta: { cellClassName: 'w-10 pr-2 sm:pr-4', headerClassName: 'w-10', stopRowClick: true } satisfies IncidentColumnMeta,
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
                      disabled={publishMutation.isPending || deleteMutation.isPending}
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
                    <DropdownMenuItem
                      onClick={() =>
                        publishMutation.mutate({ incidentId: incident.id, isPublished: !incident.isPublished })
                      }
                      className='cursor-pointer'
                    >
                      {incident.isPublished ? <Lock className='h-3.5 w-3.5' /> : <Check className='h-3.5 w-3.5' />}
                      {incident.isPublished ? t('unpublish') : t('publish')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => deleteMutation.mutate(incident.id)}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale, monitorNameById, publishMutation.isPending, deleteMutation.isPending],
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
  const hasActiveFilters = globalFilter.trim().length > 0 || stateFilter !== 'all' || visibilityFilter !== 'all';

  const formValid = form.title.trim().length > 0 && form.body.trim().length > 0 && form.startedAtLocal.length > 0;
  const editingPublished = form.id != null && form.isPublished;
  const publishCta = editingPublished ? t('form.updatePublic') : t('form.publishCta');

  const reload = () => {
    incidentsQuery.refetch();
    suggestionsQuery.refetch();
    router.refresh();
  };

  return (
    <div className='space-y-4'>
      {/* Detected outages — a restrained amber callout you can promote to an incident. */}
      {suggestions.map((suggestion) => {
        const detail = suggestion.ongoing
          ? t('ongoingSince', { date: formatRelativeTimeFromNow(suggestion.startedAt, locale) })
          : (formatLocalDateTime(suggestion.startedAt, locale, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }) ?? '');
        return (
          <div
            key={suggestion.detectedIncidentId}
            className='flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/6 p-4'
          >
            <TriangleAlert className='h-5 w-5 flex-none text-amber-500' />
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-semibold'>{t('detectedTitle')}</div>
              <div suppressHydrationWarning className='text-muted-foreground mt-0.5 text-xs'>
                {t('detectedDescription', { monitor: suggestion.monitorPublicName, detail })}
              </div>
            </div>
            <PermissionGate>
              {(disabled) => (
                <Button
                  size='sm'
                  disabled={disabled}
                  onClick={() => openFromSuggestion(suggestion)}
                  className='flex-none cursor-pointer bg-amber-500 text-white hover:bg-amber-500/90'
                >
                  {t('createFromSuggestion')}
                </Button>
              )}
            </PermissionGate>
          </div>
        );
      })}

      {/* Header */}
      <div className='flex items-end justify-between gap-4'>
        <div>
          <h2 className='font-semibold'>{t('title')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{t('listSubtitle')}</p>
        </div>
        <PermissionGate>
          {(disabled) => (
            <Button size='sm' disabled={disabled} onClick={openCreate} className='flex-none cursor-pointer'>
              <Plus className='mr-1 h-4 w-4' />
              {t('newIncident')}
            </Button>
          )}
        </PermissionGate>
      </div>

      {!isLoading && incidents.length === 0 ? (
        <div className='bg-card border-border overflow-hidden rounded-xl border'>
          <div className='flex flex-col items-center justify-center px-6 py-16 text-center'>
            <span className='bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full'>
              <Activity className='h-5 w-5' />
            </span>
            <p className='text-foreground mt-3 text-sm font-medium'>{t('noIncidents')}</p>
            <p className='text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed'>{t('emptyHint')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar: search on the left, State / Visibility filters + reload on the right. */}
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='relative sm:max-w-xs sm:flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                type='text'
                placeholder={t('filters.search')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className='pl-9'
              />
            </div>
            <div className='flex items-center gap-2 sm:ml-auto'>
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
              <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as VisibilityFilter)}>
                <SelectTrigger size='sm' className='w-[140px]' aria-label={t('filters.visibility')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('filters.visibilityAll')}</SelectItem>
                  <SelectItem value='published'>{t('filters.visibilityPublished')}</SelectItem>
                  <SelectItem value='internal'>{t('filters.visibilityInternal')}</SelectItem>
                </SelectContent>
              </Select>
              <PermissionGate allowViewer>
                {(disabled) => (
                  <Button
                    variant='outline'
                    size='sm'
                    className='shrink-0 cursor-pointer'
                    disabled={isRefreshing || disabled}
                    onClick={reload}
                    aria-label={t('filters.reload')}
                  >
                    <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                  </Button>
                )}
              </PermissionGate>
            </div>
          </div>

          <div className='border-border overflow-x-auto rounded-lg border'>
            <Table className='min-w-[920px]'>
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
                      className='hover:bg-accent dark:hover:bg-primary/10 group cursor-pointer'
                      onClick={() => openEdit(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as IncidentColumnMeta | undefined;
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
        </>
      )}

      {/* Create / edit incident modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>{form.id ? t('editIncident') : t('newIncident')}</DialogTitle>
            <DialogDescription>{t('form.saveHint')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-5'>
            <div className='space-y-1.5'>
              <Label htmlFor='inc-title'>{t('form.title')}</Label>
              <Input
                id='inc-title'
                value={form.title}
                maxLength={STATUS_PAGE_LIMITS.INCIDENT_TITLE_MAX}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className='space-y-2'>
              <Label>{t('form.impact')}</Label>
              <div className='flex flex-wrap gap-2'>
                {IMPACTS.map((option) => {
                  const selected = form.impact === option;
                  return (
                    <button
                      key={option}
                      type='button'
                      onClick={() => setForm((f) => ({ ...f, impact: option }))}
                      className={cn(
                        'cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                        selected
                          ? IMPACT_SELECTED[option]
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t(`impact.${option}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className='space-y-2'>
              <Label>{t('form.monitor')}</Label>
              <div className='flex flex-wrap gap-2'>
                <Chip
                  selected={form.monitorCheckId === null}
                  onClick={() => setForm((f) => ({ ...f, monitorCheckId: null }))}
                  label={t('form.monitorNone')}
                />
                {monitors.map((monitor) => (
                  <Chip
                    key={monitor.monitorCheckId}
                    selected={form.monitorCheckId === monitor.monitorCheckId}
                    onClick={() => setForm((f) => ({ ...f, monitorCheckId: monitor.monitorCheckId }))}
                    label={monitor.publicName}
                  />
                ))}
              </div>
            </div>

            <div className='space-y-2'>
              <Label>{t('form.status')}</Label>
              <div className='bg-secondary inline-flex flex-wrap gap-1 rounded-md p-1'>
                {STATUSES.map((option) => {
                  const selected = form.status === option;
                  return (
                    <button
                      key={option}
                      type='button'
                      onClick={() => setForm((f) => ({ ...f, status: option }))}
                      className={cn(
                        'cursor-pointer rounded px-3 py-1.5 text-sm transition-colors',
                        selected
                          ? 'bg-card text-foreground font-medium shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t(`status.${option}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='inc-body'>{t('form.body')}</Label>
              <Textarea
                id='inc-body'
                rows={4}
                value={form.body}
                maxLength={STATUS_PAGE_LIMITS.INCIDENT_BODY_MAX}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='inc-started'>{t('form.startedAt')}</Label>
                <Input
                  id='inc-started'
                  type='datetime-local'
                  value={form.startedAtLocal}
                  onChange={(e) => setForm((f) => ({ ...f, startedAtLocal: e.target.value }))}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='inc-resolved'>{t('form.resolvedAt')}</Label>
                <Input
                  id='inc-resolved'
                  type='datetime-local'
                  value={form.resolvedAtLocal}
                  onChange={(e) => setForm((f) => ({ ...f, resolvedAtLocal: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className='sm:items-center sm:justify-between'>
            <Button variant='outline' onClick={() => setOpen(false)} className='cursor-pointer'>
              {t('form.cancel')}
            </Button>
            <div className='flex flex-col-reverse gap-2 sm:flex-row sm:items-center'>
              <PermissionGate>
                {(disabled) => (
                  <Button
                    variant='outline'
                    disabled={disabled || !formValid || saveMutation.isPending}
                    onClick={() => saveMutation.mutate({ ...form, isPublished: false })}
                    className='cursor-pointer'
                  >
                    <Lock className='h-3.5 w-3.5' />
                    {t('form.saveInternal')}
                  </Button>
                )}
              </PermissionGate>
              <PermissionGate>
                {(disabled) => (
                  <Button
                    disabled={disabled || !formValid || saveMutation.isPending}
                    onClick={() => saveMutation.mutate({ ...form, isPublished: true })}
                    className='cursor-pointer'
                  >
                    {publishCta}
                  </Button>
                )}
              </PermissionGate>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Chip({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        selected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {selected && <Check className='h-3.5 w-3.5' />}
      {label}
    </button>
  );
}
