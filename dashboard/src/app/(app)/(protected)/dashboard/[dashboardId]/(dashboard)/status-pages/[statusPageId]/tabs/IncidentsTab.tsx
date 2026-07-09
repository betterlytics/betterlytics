'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatElapsedTime, formatLocalDateTime, formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { useDisplayHour12 } from '@/hooks/use-display-hour12';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaginationControls } from '@/components/PaginationControls';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { ConfirmDialog } from '@/components/dialogs';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import {
  type DetectedOutageSuggestion,
  type StatusPageIncident,
  type StatusPageIncidentImpact,
  type StatusPageIncidentStatusValue,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { INCIDENT_STATUS_TONE, type IncidentStatusTone } from '@/components/statusPage/incidentStatusTone';
import { Timeline, TimelineItem } from '@/components/statusPage/Timeline';
import { createIncidentEntryFormatter } from '@/components/statusPage/incidentEntryTimestamp';
import {
  createStatusPageIncidentAction,
  deleteStatusPageIncidentAction,
  fetchIncidentSuggestionsAction,
  fetchIncidentTimelineAction,
  fetchStatusPageIncidentsAction,
  saveStatusPageIncidentChangesAction,
} from '@/app/actions/analytics/statusPage.actions';
import { AffectedMonitorsPicker } from './AffectedMonitorsPicker';
import { Section } from './Section';

type MonitorOption = { monitorCheckId: string; publicName: string };

type IncidentsTabProps = {
  dashboardId: string;
  statusPageId: string;
  monitors: MonitorOption[];
};

const PAGE_SIZE = 10;

const IMPACTS: StatusPageIncidentImpact[] = ['degraded', 'partial_outage', 'outage'];
const STATUSES: StatusPageIncidentStatusValue[] = ['investigating', 'identified', 'monitoring', 'resolved'];

// "Active" = still ongoing (no resolved timestamp); "Resolved" = has one. These replace the old
// active/past section split with a single filterable dimension.
type StateFilter = 'all' | 'active' | 'resolved';

const STATUS_TONE_BADGE: Record<IncidentStatusTone, string> = {
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  orange: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  blue: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const STATUS_TONE_DOT: Record<IncidentStatusTone, string> = {
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  blue: 'bg-sky-500',
  green: 'bg-emerald-500',
};

const statusBadgeClass = (status: StatusPageIncidentStatusValue) =>
  STATUS_TONE_BADGE[INCIDENT_STATUS_TONE[status]];

const statusDotClass = (status: StatusPageIncidentStatusValue) => STATUS_TONE_DOT[INCIDENT_STATUS_TONE[status]];

const STATUS_TONE_DOT_HOLLOW: Record<IncidentStatusTone, string> = {
  amber: 'bg-background border-2 border-amber-500',
  orange: 'bg-background border-2 border-orange-500',
  blue: 'bg-background border-2 border-sky-500',
  green: 'bg-background border-2 border-emerald-500',
};

const statusDotHollowClass = (status: StatusPageIncidentStatusValue) =>
  STATUS_TONE_DOT_HOLLOW[INCIDENT_STATUS_TONE[status]];

const STATUS_TONE_TEXT: Record<IncidentStatusTone, string> = {
  amber: 'text-amber-600 dark:text-amber-400',
  orange: 'text-orange-600 dark:text-orange-400',
  blue: 'text-sky-600 dark:text-sky-400',
  green: 'text-emerald-600 dark:text-emerald-400',
};

const statusTextClass = (status: StatusPageIncidentStatusValue) => STATUS_TONE_TEXT[INCIDENT_STATUS_TONE[status]];

const IMPACT_BADGE: Record<StatusPageIncidentImpact, string> = {
  degraded: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  partial_outage: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  outage: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

// Suggestion-row dot while the outage is ongoing; resolved rows switch to emerald.
const IMPACT_DOT: Record<StatusPageIncidentImpact, string> = {
  degraded: 'bg-amber-500',
  partial_outage: 'bg-orange-500',
  outage: 'bg-rose-500',
};

// Impact selector in the modal: muted by default, tinted when picked.
const IMPACT_SELECTED: Record<StatusPageIncidentImpact, string> = {
  degraded: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  partial_outage: 'border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  outage: 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

type IncidentColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
  stopRowClick?: boolean;
};

// Incident details only — status / resolved state are timeline-derived, never edited here.
type IncidentForm = {
  id: string | null;
  detectedIncidentId: string | null;
  title: string;
  impact: StatusPageIncidentImpact;
  monitorCheckIds: string[];
};

// The "Post an update" box. On create it's the incident's first update; on edit it stages new ones.
type Composer = {
  status: StatusPageIncidentStatusValue;
  message: string;
  timeLocal: string;
};

// An update staged in the sheet (edit mode) but not yet published — committed on save.
type PendingUpdate = {
  tempId: string;
  status: StatusPageIncidentStatusValue;
  message: string;
  timeLocal: string;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(): IncidentForm {
  return { id: null, detectedIncidentId: null, title: '', impact: 'outage', monitorCheckIds: [] };
}

function emptyComposer(): Composer {
  return { status: 'investigating', message: '', timeLocal: toLocalInput(new Date()) };
}

export function IncidentsTab({ dashboardId, statusPageId, monitors }: IncidentsTabProps) {
  const t = useTranslations('statusPagesPage.editor.incidents');
  const locale = useLocale() as SupportedLanguages;
  const hour12 = useDisplayHour12();
  const todayLabel = t('timeline.today');
  const yesterdayLabel = t('timeline.yesterday');
  const formatIncidentEntry = useMemo(
    () =>
      createIncidentEntryFormatter({ locale, hour12, labels: { today: todayLabel, yesterday: yesterdayLabel } }),
    [locale, hour12, todayLabel, yesterdayLabel],
  );
  const router = useRouter();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  // Guards an accidental close (overlay / Esc / Cancel) when there's unsaved work in the sheet.
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [form, setForm] = useState<IncidentForm>(emptyForm);
  // Snapshot of the details, taken when the sheet opens, to surface an "unsaved changes" hint.
  const [initialForm, setInitialForm] = useState<IncidentForm>(emptyForm);
  // The "Post an update" box (first update on create, staged updates on edit).
  const [composer, setComposer] = useState<Composer>(emptyComposer);
  // Updates staged locally (edit mode) — not published until "Update public page".
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  // Baseline for the dirty check
  const [initialPendingUpdates, setInitialPendingUpdates] = useState<PendingUpdate[]>([]);
  const pendingIdRef = useRef(0);
  // Seeds the header status pill before the timeline loads (edit only).
  const [incidentStatus, setIncidentStatus] = useState<StatusPageIncidentStatusValue>('investigating');
  // Inline message edit of a timeline entry.
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editedUpdates, setEditedUpdates] = useState<Record<string, string>>({});
  const [deletedUpdateIds, setDeletedUpdateIds] = useState<string[]>([]);
  const [titleTouched, setTitleTouched] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  // Set when the user tries to post a no-op update (same status, no message); surfaces the reason.
  const [composerError, setComposerError] = useState(false);
  const composerMessageRef = useRef<HTMLTextAreaElement>(null);

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
  // Timeline for the incident currently open in the edit modal; skipped while creating.
  const timelineQuery = useQuery({
    queryKey: ['statusPageIncidentTimeline', statusPageId, form.id],
    queryFn: () => fetchIncidentTimelineAction(dashboardId, statusPageId, form.id as string),
    enabled: open && form.id != null,
  });

  const afterMutation = () => {
    queryClient.invalidateQueries({ queryKey: incidentsKey });
    queryClient.invalidateQueries({ queryKey: suggestionsKey });
    queryClient.invalidateQueries({ queryKey: ['statusPageIncidentTimeline', statusPageId] });
    router.refresh(); // keep the live preview / public page in sync
  };

  // Only the incident details count as metadata; staged updates are tracked separately.
  const metadataDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const pendingDirty = JSON.stringify(pendingUpdates) !== JSON.stringify(initialPendingUpdates);
  const timelineEditsDirty = Object.keys(editedUpdates).length > 0 || deletedUpdateIds.length > 0;
  const hasChanges = metadataDirty || pendingDirty || timelineEditsDirty;
  // Anything that would be lost on close: saved-but-unpublished work, a half-typed update, or an
  // in-progress inline edit. Closing with any of these prompts before discarding.
  const hasUnsavedWork = hasChanges || composer.message.trim().length > 0 || editingUpdateId != null;

  // Intercept close attempts (overlay click, Esc, the X, Cancel) — confirm first if work would be lost.
  const requestClose = () => {
    if (hasUnsavedWork) setShowDiscardConfirm(true);
    else setOpen(false);
  };

  // Save publishes everything at once: incident details, plus any staged updates. On create the
  // composer is the incident's first update; on edit, staged updates are posted in order.
  const saveMutation = useMutation({
    mutationFn: async () => {
      const stagedUpdates = pendingUpdates.map((update) => ({
        status: update.status,
        message: update.message.trim(),
        occurredAt: new Date(update.timeLocal),
      }));

      if (!form.id) {
        await createStatusPageIncidentAction(dashboardId, {
          statusPageId,
          title: form.title.trim(),
          message: composer.message.trim(),
          impact: form.impact,
          status: composer.status,
          monitorCheckIds: form.monitorCheckIds,
          detectedIncidentId: form.detectedIncidentId,
          startedAt: new Date(composer.timeLocal),
          updates: stagedUpdates,
        });
        return;
      }

      await saveStatusPageIncidentChangesAction(dashboardId, {
        incidentId: form.id,
        statusPageId,
        metadata: metadataDirty
          ? { title: form.title.trim(), impact: form.impact, monitorCheckIds: form.monitorCheckIds }
          : undefined,
        editedUpdates: Object.entries(editedUpdates).map(([updateId, message]) => ({
          updateId,
          message: message.trim(),
        })),
        newUpdates: stagedUpdates,
        deletedUpdateIds,
      });
    },
    onSuccess: () => {
      setOpen(false);
      afterMutation();
      toast.success(t('saved'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  // Stage the composer's update locally (edit mode) — published later by "Update public page".
  const stagePendingUpdate = () => {
    pendingIdRef.current += 1;
    const staged: PendingUpdate = {
      tempId: `pending-${pendingIdRef.current}`,
      status: composer.status,
      message: composer.message.trim(),
      timeLocal: composer.timeLocal,
    };
    setPendingUpdates((list) => [...list, staged]);
    setComposer((c) => ({ ...c, message: '', timeLocal: toLocalInput(new Date()) }));
    setComposerError(false);
  };

  const removePendingUpdate = (tempId: string) =>
    setPendingUpdates((list) => list.filter((u) => u.tempId !== tempId));

  const commitPendingEdit = (tempId: string) => {
    setPendingUpdates((list) => list.map((u) => (u.tempId === tempId ? { ...u, message: editDraft.trim() } : u)));
    setEditingUpdateId(null);
  };

  const commitSavedEdit = (updateId: string) => {
    const original = timeline.find((e) => e.id === updateId)?.message ?? '';
    const next = editDraft.trim();
    setEditedUpdates((map) => {
      const copy = { ...map };
      if (next === original) delete copy[updateId];
      else copy[updateId] = next;
      return copy;
    });
    setEditingUpdateId(null);
  };

  const stageDeleteUpdate = (updateId: string) => {
    setDeletedUpdateIds((ids) => (ids.includes(updateId) ? ids : [...ids, updateId]));
    setEditedUpdates((map) => {
      if (!(updateId in map)) return map;
      const copy = { ...map };
      delete copy[updateId];
      return copy;
    });
    if (editingUpdateId === updateId) setEditingUpdateId(null);
  };

  const deleteMutation = useMutation({
    mutationFn: (incidentId: string) => deleteStatusPageIncidentAction(dashboardId, statusPageId, incidentId),
    onSuccess: () => {
      afterMutation();
      toast.success(t('deleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  // Open the sheet, snapshotting the details for the dirty check and resetting the composer.
  const openWith = (
    next: IncidentForm,
    nextComposer: Composer,
    status: StatusPageIncidentStatusValue,
    pending: PendingUpdate[] = [],
  ) => {
    setForm(next);
    setInitialForm(next);
    setComposer(nextComposer);
    setPendingUpdates(pending);
    setInitialPendingUpdates(pending);
    setIncidentStatus(status);
    setEditingUpdateId(null);
    setEditedUpdates({});
    setDeletedUpdateIds([]);
    setTitleTouched(false);
    setComposerError(false);
    setOpen(true);
  };

  const openCreate = () => openWith(emptyForm(), emptyComposer(), 'investigating');

  const openEdit = (incident: StatusPageIncident) =>
    openWith(
      {
        id: incident.id,
        detectedIncidentId: incident.detectedIncidentId,
        title: incident.title,
        impact: incident.impact,
        monitorCheckIds: incident.monitorCheckIds,
      },
      // The composer starts on the incident's current status so a quick post defaults sensibly.
      { ...emptyComposer(), status: incident.status },
      incident.status,
    );

  const openFromSuggestion = (suggestion: DetectedOutageSuggestion) => {
    const resolved = !suggestion.ongoing && suggestion.resolvedAt != null;
    const title =
      suggestion.monitors.length === 1
        ? t('suggestedTitle', { monitor: suggestion.monitors[0].monitorPublicName })
        : t('suggestedTitleMulti', { count: suggestion.monitors.length });
    pendingIdRef.current += 1;
    openWith(
      {
        ...emptyForm(),
        detectedIncidentId: suggestion.detectedIncidentId,
        title,
        impact: suggestion.suggestedImpact,
        monitorCheckIds: suggestion.monitors.map((monitor) => monitor.monitorCheckId),
      },
      {
        ...emptyComposer(),
        timeLocal: toLocalInput(new Date(suggestion.startedAt)),
      },
      'investigating',
      resolved
        ? [
            {
              tempId: `pending-${pendingIdRef.current}`,
              status: 'resolved',
              message: '',
              timeLocal: toLocalInput(new Date(suggestion.resolvedAt as string)),
            },
          ]
        : [],
    );
  };

  const beginEditUpdate = (updateId: string, message: string) => {
    setEditingUpdateId(updateId);
    setEditDraft(message);
  };

  const incidents = useMemo(() => incidentsQuery.data ?? [], [incidentsQuery.data]);
  const suggestions = suggestionsQuery.data ?? [];
  const isLoading = incidentsQuery.isLoading;
  const isEmpty = !isLoading && incidents.length === 0;

  const monitorNameById = useMemo(
    () => new Map(monitors.map((monitor) => [monitor.monitorCheckId, monitor.publicName])),
    [monitors],
  );

  // Resolve affected monitors to their public names, dropping any no longer on the page. Empty = page-wide.
  const affectedNames = (incident: StatusPageIncident): string[] =>
    incident.monitorCheckIds.map((id) => monitorNameById.get(id)).filter((name): name is string => name != null);

  const affectedLabel = (incident: StatusPageIncident): string => {
    const names = affectedNames(incident);
    return names.length > 0 ? names.join(', ') : t('unspecified');
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

  // Pre-filter by the State select before the table applies search + sort.
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
  }, [stateFilter]);

  const columns = useMemo<ColumnDef<StatusPageIncident, unknown>[]>(
    () => [
      {
        id: 'incident',
        accessorFn: (row) => `${row.title} ${row.body}`,
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
          const names = affectedNames(row.original);
          if (names.length === 0) {
            return <span className='text-muted-foreground'>{t('unspecified')}</span>;
          }

          // Capped pill list; monitors beyond the cap collapse into a "+N more" badge
          // whose tooltip reveals the hidden names.
          const MAX_PILLS = 2;
          const shown = names.slice(0, MAX_PILLS);
          const hidden = names.slice(MAX_PILLS);
          // No wrap: the cell's min width becomes the full pill row, so the greedy
          // incident column (w-full) gives up space instead of the pills stacking.
          return (
            <div className='flex items-center gap-1'>
              {shown.map((name, i) => (
                <Badge key={i} variant='secondary' className='border-border max-w-35 font-normal'>
                  <span className='min-w-0 truncate'>{name}</span>
                </Badge>
              ))}
              {hidden.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant='outline'
                      className='border-border text-muted-foreground cursor-help font-normal'
                    >
                      {t('affectedMore', { count: hidden.length })}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    side='top'
                    className='border-border bg-popover/95 text-popover-foreground pointer-events-none max-w-60 rounded-lg border p-2.5 shadow-xl backdrop-blur-sm'
                  >
                    <ul className='space-y-0.5 text-xs'>
                      {hidden.map((name, i) => (
                        <li key={i} className='truncate'>
                          {name}
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
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
                      disabled={deleteMutation.isPending}
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
    [t, locale, monitorNameById, deleteMutation.isPending],
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

  // Newest-first saved timeline for the open incident.
  const timeline = useMemo(() => (timelineQuery.data ?? []).slice().reverse(), [timelineQuery.data]);
  const timelineRows = useMemo(() => {
    const rows = [
      ...pendingUpdates.map((u) => ({
        kind: 'pending' as const,
        key: u.tempId,
        id: u.tempId,
        status: u.status,
        message: u.message,
        date: new Date(u.timeLocal),
      })),
      ...timeline
        .filter((e) => !deletedUpdateIds.includes(e.id))
        .map((e) => ({
          kind: 'saved' as const,
          key: e.id,
          id: e.id,
          status: e.status,
          message: editedUpdates[e.id] ?? e.message,
          date: e.createdAt,
        })),
    ];
    return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [pendingUpdates, timeline, editedUpdates, deletedUpdateIds]);

  const latestStatus = timelineRows[0]?.status ?? (form.id != null ? incidentStatus : composer.status);
  const headerStatus = latestStatus;
  const atUpdateCap = timelineRows.length >= STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX;
  const composerIsNoop = composer.message.trim().length === 0 && composer.status === latestStatus;
  const showComposerHint = composerError && composerIsNoop;

  const handleAddUpdate = () => {
    if (composerIsNoop) {
      setComposerError(true);
      composerMessageRef.current?.focus();
      return;
    }
    stagePendingUpdate();
  };

  const titleMissing = form.title.trim().length === 0;
  const showTitleError = titleTouched && titleMissing;

  const saveCta = form.id != null ? t('form.updatePublic') : t('form.publishCta');

  const handleSaveClick = () => {
    if (titleMissing) {
      setTitleTouched(true);
      titleInputRef.current?.focus();
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className='space-y-4'>
      {suggestions.length > 0 && (
        <div className='overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/5'>
          <button
            type='button'
            onClick={() => setSuggestionsOpen((prev) => !prev)}
            aria-expanded={suggestionsOpen}
            className='flex w-full cursor-pointer items-center gap-3 bg-amber-500/6 px-4 py-3 text-left'
          >
            <TriangleAlert className='h-5 w-5 flex-none text-amber-500' />
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-semibold'>{t('detectedPanelTitle', { count: suggestions.length })}</div>
              <div className='text-muted-foreground text-xs'>{t('suggestionsHint')}</div>
            </div>
            <ChevronDown
              className={cn(
                'text-muted-foreground h-4 w-4 flex-none transition-transform',
                suggestionsOpen && 'rotate-180',
              )}
            />
          </button>
          {suggestionsOpen && (
            <div className='max-h-80 overflow-y-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='text-muted-foreground border-y border-amber-500/20 bg-amber-500/7 text-left text-[11px] tracking-wider uppercase'>
                    <th className='py-2 pr-3 pl-4 font-semibold'>{t('suggestionsTable.outage')}</th>
                    <th className='hidden px-3 py-2 font-semibold md:table-cell'>
                      {t('suggestionsTable.monitors')}
                    </th>
                    <th className='hidden px-3 py-2 font-semibold sm:table-cell'>
                      {t('suggestionsTable.detected')}
                    </th>
                    <th className='hidden px-3 py-2 font-semibold lg:table-cell'>
                      {t('suggestionsTable.duration')}
                    </th>
                    <th className='px-3 py-2 font-semibold'>{t('suggestionsTable.status')}</th>
                    <th className='py-2 pr-4 pl-3' />
                  </tr>
                </thead>
                <tbody className='divide-y divide-amber-500/15'>
                  {suggestions.map((suggestion) => {
                    const isMulti = suggestion.monitors.length > 1;
                    const heading = isMulti
                      ? t('detectedGroupMulti', { count: suggestion.monitors.length })
                      : suggestion.monitors[0].monitorPublicName;
                    const MAX_PILLS = 2;
                    const shown = suggestion.monitors.slice(0, MAX_PILLS);
                    const hidden = suggestion.monitors.slice(MAX_PILLS);
                    const detected = suggestion.ongoing
                      ? formatRelativeTimeFromNow(suggestion.startedAt, locale)
                      : (formatLocalDateTime(suggestion.startedAt, locale, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12,
                        }) ?? '');
                    // Elapsed for ongoing, full span for resolved (same shifted-start trick as durationLabel).
                    const durationMs =
                      (suggestion.ongoing
                        ? Date.now()
                        : new Date(suggestion.resolvedAt ?? suggestion.startedAt).getTime()) -
                      new Date(suggestion.startedAt).getTime();
                    const duration = formatElapsedTime(new Date(Date.now() - durationMs), locale);
                    return (
                      <tr key={suggestion.detectedIncidentId} className='hover:bg-amber-500/6'>
                        <td className='w-full max-w-0 min-w-[160px] py-2.5 pr-3 pl-4'>
                          <div className='flex items-center gap-2.5'>
                            <span className='relative flex h-2 w-2 flex-none'>
                              {suggestion.ongoing && (
                                <span
                                  className={cn(
                                    'absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping',
                                    IMPACT_DOT[suggestion.suggestedImpact],
                                  )}
                                />
                              )}
                              <span
                                className={cn(
                                  'relative inline-flex h-2 w-2 rounded-full',
                                  suggestion.ongoing ? IMPACT_DOT[suggestion.suggestedImpact] : 'bg-emerald-500',
                                )}
                              />
                            </span>
                            <span className='truncate text-sm font-medium'>{heading}</span>
                          </div>
                        </td>
                        <td className='hidden px-3 py-2.5 md:table-cell'>
                          <div className='flex items-center gap-1'>
                            {shown.map((monitor) => (
                              <Badge
                                key={monitor.monitorCheckId}
                                variant='secondary'
                                className='border-border max-w-35 font-normal'
                              >
                                <span className='min-w-0 truncate'>{monitor.monitorPublicName}</span>
                              </Badge>
                            ))}
                            {hidden.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant='outline'
                                    className='border-border text-muted-foreground cursor-help font-normal'
                                  >
                                    {t('affectedMore', { count: hidden.length })}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent
                                  side='top'
                                  className='border-border bg-popover/95 text-popover-foreground pointer-events-none max-w-60 rounded-lg border p-2.5 shadow-xl backdrop-blur-sm'
                                >
                                  <ul className='space-y-0.5 text-xs'>
                                    {hidden.map((monitor) => (
                                      <li key={monitor.monitorCheckId} className='truncate'>
                                        {monitor.monitorPublicName}
                                      </li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                        <td
                          suppressHydrationWarning
                          className='text-muted-foreground hidden px-3 py-2.5 text-xs whitespace-nowrap sm:table-cell'
                        >
                          {detected}
                        </td>
                        <td
                          suppressHydrationWarning
                          className='text-muted-foreground hidden px-3 py-2.5 text-xs whitespace-nowrap lg:table-cell'
                        >
                          {duration}
                        </td>
                        <td className='px-3 py-2.5'>
                          <Badge
                            variant='outline'
                            className={cn(
                              'whitespace-nowrap',
                              suggestion.ongoing
                                ? IMPACT_BADGE[suggestion.suggestedImpact]
                                : STATUS_TONE_BADGE.green,
                            )}
                          >
                            {suggestion.ongoing ? t('suggestionsTable.ongoing') : t('suggestionsTable.resolved')}
                          </Badge>
                        </td>
                        <td className='py-2.5 pr-4 pl-3 text-right'>
                          <PermissionGate>
                            {(disabled) => (
                              <Button
                                size='sm'
                                disabled={disabled}
                                onClick={() => openFromSuggestion(suggestion)}
                                className='flex-none cursor-pointer'
                              >
                                {t('createFromSuggestion')}
                              </Button>
                            )}
                          </PermissionGate>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                        className='hover:bg-accent dark:hover:bg-primary/10 group cursor-pointer'
                        onClick={() => openEdit(row.original)}
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

      <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : requestClose())}>
        <SheetContent side='right' className='flex w-full flex-col gap-0 p-0 sm:max-w-2xl'>
          <SheetHeader className='flex-row items-start justify-between space-y-0 border-b px-6 py-4 pr-12'>
            <div className='min-w-0 space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <SheetTitle className='text-base'>{form.id ? t('editIncident') : t('newIncident')}</SheetTitle>
                <Badge variant='outline' className={statusBadgeClass(headerStatus)}>
                  {t(`status.${headerStatus}`)}
                </Badge>
              </div>
              <SheetDescription className='text-xs'>{t('formHint')}</SheetDescription>
            </div>
          </SheetHeader>

          <div className='min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5'>
            <section className='space-y-5'>
              <div className='text-muted-foreground text-[11px] font-semibold tracking-wider uppercase'>
                {t('form.detailsSection')}
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='inc-title'>
                  {t('form.title')}
                  <span className='text-destructive ml-0.5'>*</span>
                </Label>
                <Input
                  id='inc-title'
                  ref={titleInputRef}
                  value={form.title}
                  maxLength={STATUS_PAGE_LIMITS.INCIDENT_TITLE_MAX}
                  aria-invalid={showTitleError}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onBlur={() => setTitleTouched(true)}
                  className={cn(showTitleError && 'border-destructive focus-visible:ring-destructive/30')}
                />
                {showTitleError && <p className='text-destructive text-xs'>{t('form.titleRequired')}</p>}
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
                <p className='text-muted-foreground text-xs'>{t('form.monitorHelp')}</p>
                <AffectedMonitorsPicker
                  monitors={monitors}
                  value={form.monitorCheckIds}
                  onChange={(ids) => setForm((f) => ({ ...f, monitorCheckIds: ids }))}
                />
              </div>
            </section>

            <div className='bg-border h-px' />

            <section className='space-y-3'>
              <div className='text-muted-foreground text-[11px] font-semibold tracking-wider uppercase'>
                {t('composer.section')}
              </div>
              <div className='border-border bg-muted/30 space-y-3 rounded-xl border p-3.5'>
                <div className='flex flex-wrap gap-1.5'>
                  {STATUSES.map((option) => {
                    const selected = composer.status === option;
                    return (
                      <button
                        key={option}
                        type='button'
                        onClick={() => setComposer((c) => ({ ...c, status: option }))}
                        className={cn(
                          'cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                          selected
                            ? statusBadgeClass(option)
                            : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {t(`status.${option}`)}
                      </button>
                    );
                  })}
                </div>
                <Textarea
                  id='inc-message'
                  ref={composerMessageRef}
                  rows={3}
                  placeholder={t('composer.messagePlaceholder')}
                  value={composer.message}
                  maxLength={STATUS_PAGE_LIMITS.INCIDENT_UPDATE_MESSAGE_MAX}
                  onChange={(e) => setComposer((c) => ({ ...c, message: e.target.value }))}
                />
                <div className='flex flex-wrap items-center gap-2'>
                  <DateTimePicker
                    value={new Date(composer.timeLocal)}
                    onChange={(date) => setComposer((c) => ({ ...c, timeLocal: toLocalInput(date) }))}
                    locale={locale}
                    dateLabel={t('composer.time')}
                    timeLabel={t('composer.time')}
                  />
                  <PermissionGate>
                    {(disabled) => (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={handleAddUpdate}
                        disabled={disabled || atUpdateCap}
                        className='ml-auto cursor-pointer'
                      >
                        <Plus className='h-3.5 w-3.5' />
                        {t('timeline.addUpdate')}
                      </Button>
                    )}
                  </PermissionGate>
                </div>
                {showComposerHint && <p className='text-destructive text-xs'>{t('composer.noopHint')}</p>}
              </div>
            </section>

            {(form.id != null || pendingUpdates.length > 0) && (
              <section className='space-y-3'>
                <div className='text-muted-foreground text-[11px] font-semibold tracking-wider uppercase'>
                  {t('timeline.title')}
                </div>
                {timelineQuery.isLoading ? (
                  <div className='space-y-2'>
                    {Array.from({ length: 3 }, (_, i) => (
                      <Skeleton key={i} className='h-16 w-full' />
                    ))}
                  </div>
                ) : timeline.length === 0 && pendingUpdates.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>{t('timeline.empty')}</p>
                ) : (
                  <Timeline>
                    {timelineRows.map((row, i) => {
                      const isLast = i === timelineRows.length - 1;
                      const pending = row.kind === 'pending';
                      const editing = editingUpdateId === row.id;
                      return (
                        <TimelineItem
                          key={row.key}
                          isLast={isLast}
                          headHeightPx={28}
                          spacingPx={16}
                          lineClassName='bg-border'
                          className='group'
                          dot={
                            <div
                              className={cn(
                                'ring-background h-2.5 w-2.5 rounded-full ring',
                                pending ? statusDotHollowClass(row.status) : statusDotClass(row.status),
                              )}
                            />
                          }
                        >
                          <div className='flex h-7 items-center gap-2'>
                            <span className={cn('text-[13px] font-semibold', statusTextClass(row.status))}>
                              {t(`status.${row.status}`)}
                            </span>
                            <div className='ml-auto flex flex-none items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100'>
                              {pending ? (
                                <>
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    aria-label={t('timeline.editMessage')}
                                    onClick={() => beginEditUpdate(row.id, row.message)}
                                    className='text-muted-foreground hover:text-foreground h-7 w-7 cursor-pointer'
                                  >
                                    <Pencil className='h-3.5 w-3.5' />
                                  </Button>
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    aria-label={t('timeline.removePending')}
                                    onClick={() => removePendingUpdate(row.id)}
                                    className='text-muted-foreground hover:text-destructive h-7 w-7 cursor-pointer'
                                  >
                                    <X className='h-3.5 w-3.5' />
                                  </Button>
                                </>
                              ) : (
                                <PermissionGate hideWhenDisabled>
                                  {() => (
                                    <>
                                      <Button
                                        size='icon'
                                        variant='ghost'
                                        aria-label={t('timeline.editMessage')}
                                        onClick={() => beginEditUpdate(row.id, row.message)}
                                        className='text-muted-foreground hover:text-foreground h-7 w-7 cursor-pointer'
                                      >
                                        <Pencil className='h-3.5 w-3.5' />
                                      </Button>
                                      <Button
                                        size='icon'
                                        variant='ghost'
                                        aria-label={t('timeline.deleteUpdate')}
                                        disabled={timelineRows.length <= 1}
                                        onClick={() => stageDeleteUpdate(row.id)}
                                        className='text-muted-foreground hover:text-destructive h-7 w-7 cursor-pointer'
                                      >
                                        <Trash2 className='h-3.5 w-3.5' />
                                      </Button>
                                    </>
                                  )}
                                </PermissionGate>
                              )}
                            </div>
                          </div>

                          {editing ? (
                            <div className='mt-2 space-y-2'>
                              <Textarea
                                rows={3}
                                autoFocus
                                value={editDraft}
                                maxLength={STATUS_PAGE_LIMITS.INCIDENT_UPDATE_MESSAGE_MAX}
                                onChange={(e) => setEditDraft(e.target.value)}
                              />
                              <div className='flex justify-end gap-2'>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => setEditingUpdateId(null)}
                                  className='cursor-pointer'
                                >
                                  {t('form.cancel')}
                                </Button>
                                <Button
                                  size='sm'
                                  onClick={() => (pending ? commitPendingEdit(row.id) : commitSavedEdit(row.id))}
                                  className='cursor-pointer'
                                >
                                  {t('timeline.done')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            row.message && (
                              <p className='text-foreground mt-2 text-[13px] leading-relaxed break-words whitespace-pre-line'>
                                {row.message}
                              </p>
                            )
                          )}
                          <div
                            suppressHydrationWarning
                            className='text-muted-foreground mt-2 text-[12px] whitespace-nowrap tabular-nums'
                          >
                            {formatIncidentEntry(row.date, new Date())}
                          </div>
                        </TimelineItem>
                      );
                    })}
                  </Timeline>
                )}
              </section>
            )}
          </div>

          <SheetFooter className='flex-row flex-wrap items-center gap-2 border-t px-6 py-3'>
            {form.id != null && (
              <PermissionGate>
                {(disabled) => (
                  <Button
                    variant='ghost'
                    disabled={disabled || deleteMutation.isPending}
                    onClick={() => {
                      deleteMutation.mutate(form.id as string);
                      setOpen(false);
                    }}
                    className='text-destructive hover:text-destructive hidden cursor-pointer sm:inline-flex'
                  >
                    <Trash2 className='h-4 w-4' />
                    {t('form.deleteIncident')}
                  </Button>
                )}
              </PermissionGate>
            )}
            <div className='ml-auto flex flex-wrap items-center justify-end gap-2'>
              {hasChanges && (
                <span className='text-muted-foreground hidden items-center gap-1.5 text-xs sm:flex'>
                  <span className='bg-primary h-2 w-2 rounded-full' />
                  {t('form.unsaved')}
                </span>
              )}
              <Button variant='outline' onClick={requestClose} className='cursor-pointer'>
                {t('form.cancel')}
              </Button>
              <PermissionGate>
                {(disabled) => (
                  <Button
                    disabled={disabled || saveMutation.isPending}
                    onClick={handleSaveClick}
                    className='cursor-pointer'
                  >
                    {saveCta}
                  </Button>
                )}
              </PermissionGate>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={t('discard.title')}
        description={t('discard.description')}
        cancelLabel={t('discard.keep')}
        confirmLabel={t('discard.confirm')}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          setOpen(false);
        }}
      />
    </div>
  );
}
