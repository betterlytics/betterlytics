'use client';

import { useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';
import { useDisplayHour12 } from '@/hooks/use-display-hour12';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { ConfirmDialog } from '@/components/dialogs';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import {
  type DetectedOutageSuggestion,
  type StatusPageIncident,
  type StatusPageIncidentImpact,
  type StatusPageIncidentStatusValue,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';
import {
  IMPACT_SELECTED,
  statusBadgeClass,
  statusDotClass,
  statusDotHollowClass,
  statusTextClass,
} from '@/components/statusPage/incidentToneStyles';
import { Timeline, TimelineItem } from '@/components/statusPage/Timeline';
import { createIncidentEntryFormatter } from '@/components/statusPage/incidentEntryTimestamp';
import {
  createStatusPageIncidentAction,
  fetchIncidentTimelineAction,
  saveStatusPageIncidentChangesAction,
} from '@/app/actions/analytics/statusPage.actions';
import { AffectedMonitorsPicker } from './AffectedMonitorsPicker';

export type MonitorOption = { monitorCheckId: string; publicName: string };

const IMPACTS: StatusPageIncidentImpact[] = ['degraded', 'partial_outage', 'outage'];
const STATUSES: StatusPageIncidentStatusValue[] = ['investigating', 'identified', 'monitoring', 'resolved'];

type IncidentForm = {
  id: string | null;
  detectedIncidentId: string | null;
  title: string;
  description: string;
  impact: StatusPageIncidentImpact;
  monitorCheckIds: string[];
};

type Composer = {
  status: StatusPageIncidentStatusValue;
  message: string;
  timeLocal: string;
};

type PendingUpdate = {
  tempId: string;
  status: StatusPageIncidentStatusValue;
  message: string;
  occurredAtIso: string;
};

export type IncidentEditorSeed = {
  form: IncidentForm;
  composer: Composer;
  status: StatusPageIncidentStatusValue;
  pending: PendingUpdate[];
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(): IncidentForm {
  return { id: null, detectedIncidentId: null, title: '', description: '', impact: 'degraded', monitorCheckIds: [] };
}

function emptyComposer(): Composer {
  return { status: 'investigating', message: '', timeLocal: toLocalInput(new Date()) };
}

export function editorSeedForCreate(): IncidentEditorSeed {
  return {
    form: emptyForm(),
    composer: emptyComposer(),
    status: 'investigating',
    pending: [
      { tempId: 'seed-opening', status: 'investigating', message: '', occurredAtIso: new Date().toISOString() },
    ],
  };
}

export function editorSeedForIncident(incident: StatusPageIncident): IncidentEditorSeed {
  return {
    form: {
      id: incident.id,
      detectedIncidentId: incident.detectedIncidentId,
      title: incident.title,
      description: incident.description ?? '',
      impact: incident.impact,
      monitorCheckIds: incident.monitorCheckIds,
    },
    composer: { ...emptyComposer(), status: incident.status },
    status: incident.status,
    pending: [],
  };
}

export function editorSeedForSuggestion(suggestion: DetectedOutageSuggestion, title: string): IncidentEditorSeed {
  const resolved = !suggestion.ongoing && suggestion.resolvedAt != null;
  return {
    form: {
      ...emptyForm(),
      detectedIncidentId: suggestion.detectedIncidentId,
      title,
      impact: suggestion.suggestedImpact,
      monitorCheckIds: suggestion.monitors.map((monitor) => monitor.monitorCheckId),
    },
    composer: emptyComposer(),
    status: 'investigating',
    pending: [
      {
        tempId: 'seed-opening',
        status: 'investigating',
        message: '',
        occurredAtIso: new Date(suggestion.startedAt).toISOString(),
      },
      ...(resolved
        ? [
            {
              tempId: 'seed-resolved',
              status: 'resolved' as const,
              message: '',
              occurredAtIso: new Date(suggestion.resolvedAt as string).toISOString(),
            },
          ]
        : []),
    ],
  };
}

type IncidentEditorSheetProps = {
  dashboardId: string;
  statusPageId: string;
  monitors: MonitorOption[];
  seed: IncidentEditorSeed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutated: () => void;
  onDelete: (incidentId: string) => void;
  deleting: boolean;
};

export function IncidentEditorSheet({
  dashboardId,
  statusPageId,
  monitors,
  seed,
  open,
  onOpenChange,
  onMutated,
  onDelete,
  deleting,
}: IncidentEditorSheetProps) {
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

  const [form, setForm] = useState<IncidentForm>(seed.form);
  const [composer, setComposer] = useState<Composer>(seed.composer);
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>(seed.pending);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editedUpdates, setEditedUpdates] = useState<Record<string, string>>({});
  const [deletedUpdateIds, setDeletedUpdateIds] = useState<string[]>([]);
  const [titleTouched, setTitleTouched] = useState(false);
  const [timelineTouched, setTimelineTouched] = useState(false);
  const pendingIdRef = useRef(0);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const timelineQuery = useQuery({
    queryKey: ['statusPageIncidentTimeline', statusPageId, form.id],
    queryFn: () => fetchIncidentTimelineAction(dashboardId, statusPageId, form.id as string),
    enabled: open && form.id != null,
  });

  const metadataDirty = JSON.stringify(form) !== JSON.stringify(seed.form);
  const pendingDirty = JSON.stringify(pendingUpdates) !== JSON.stringify(seed.pending);
  const timelineEditsDirty = Object.keys(editedUpdates).length > 0 || deletedUpdateIds.length > 0;
  const hasChanges = metadataDirty || pendingDirty || timelineEditsDirty;
  const hasUnsavedWork = hasChanges || composer.message.trim().length > 0 || editingUpdateId != null;

  const requestClose = () => {
    if (hasUnsavedWork) setShowDiscardConfirm(true);
    else onOpenChange(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const stagedUpdates = pendingUpdates.map((update) => ({
        status: update.status,
        message: update.message.trim(),
        occurredAt: new Date(update.occurredAtIso),
      }));

      if (!form.id) {
        await createStatusPageIncidentAction(dashboardId, {
          statusPageId,
          title: form.title.trim(),
          description: form.description.trim(),
          impact: form.impact,
          monitorCheckIds: form.monitorCheckIds,
          detectedIncidentId: form.detectedIncidentId,
          updates: stagedUpdates,
        });
        return;
      }

      await saveStatusPageIncidentChangesAction(dashboardId, {
        incidentId: form.id,
        statusPageId,
        metadata: metadataDirty
          ? {
              title: form.title.trim(),
              description: form.description.trim(),
              impact: form.impact,
              monitorCheckIds: form.monitorCheckIds,
            }
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
      onOpenChange(false);
      onMutated();
      toast.success(t('saved'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const stagePendingUpdate = () => {
    pendingIdRef.current += 1;
    const staged: PendingUpdate = {
      tempId: `pending-${pendingIdRef.current}`,
      status: composer.status,
      message: composer.message.trim(),
      occurredAtIso: withEntrySeconds(composer.timeLocal).toISOString(),
    };
    setPendingUpdates((list) => [...list, staged]);
    setComposer((c) => ({ ...c, message: '', timeLocal: toLocalInput(new Date()) }));
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

  const beginEditUpdate = (updateId: string, message: string) => {
    setEditingUpdateId(updateId);
    setEditDraft(message);
  };

  const timeline = useMemo(() => (timelineQuery.data ?? []).slice().reverse(), [timelineQuery.data]);
  const timelineRows = useMemo(() => {
    const rows = [
      ...pendingUpdates.map((u) => ({
        kind: 'pending' as const,
        key: u.tempId,
        id: u.tempId,
        status: u.status,
        message: u.message,
        date: new Date(u.occurredAtIso),
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

  // The picker is minute-granular, so entries in the same minute would tie and sort
  // arbitrarily; bump the hidden seconds past any same-minute row so insertion order
  // survives sorting here, in the DB, and on the public page.
  const withEntrySeconds = (minuteLocal: string): Date => {
    const date = new Date(minuteLocal);
    const minute = Math.floor(date.getTime() / 60_000);
    const takenSeconds = timelineRows
      .filter((row) => Math.floor(row.date.getTime() / 60_000) === minute)
      .map((row) => row.date.getSeconds());
    date.setSeconds(Math.min(59, Math.max(-1, ...takenSeconds) + 1));
    return date;
  };

  const latestStatus = timelineRows[0]?.status ?? seed.status;
  const atUpdateCap = timelineRows.length >= STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX;
  const previousStatus = timelineRows[0]?.status ?? (form.id != null ? seed.status : null);
  const composerIsNoop = composer.message.trim().length === 0 && composer.status === previousStatus;

  const titleMissing = form.title.trim().length === 0;
  const showTitleError = titleTouched && titleMissing;
  const timelineMissing = form.id == null && pendingUpdates.length === 0;
  const showTimelineError = timelineTouched && timelineMissing;

  const saveCta = form.id != null ? t('form.updatePublic') : t('form.publishCta');

  const handleSaveClick = () => {
    if (titleMissing || timelineMissing) {
      setTitleTouched(true);
      setTimelineTouched(true);
      if (titleMissing) titleInputRef.current?.focus();
      return;
    }
    saveMutation.mutate();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <SheetContent side='right' className='flex w-full flex-col gap-0 p-0 sm:max-w-2xl'>
          <SheetHeader className='flex-row items-start justify-between space-y-0 border-b px-6 py-4 pr-12'>
            <div className='min-w-0 space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <SheetTitle className='text-base'>{form.id ? t('editIncident') : t('newIncident')}</SheetTitle>
                <Badge variant='outline' className={statusBadgeClass(latestStatus)}>
                  {t(`status.${latestStatus}`)}
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

              <div className='space-y-1.5'>
                <Label htmlFor='inc-description'>{t('form.description')}</Label>
                <Textarea
                  id='inc-description'
                  rows={3}
                  placeholder={t('form.descriptionPlaceholder')}
                  value={form.description}
                  maxLength={STATUS_PAGE_LIMITS.INCIDENT_DESCRIPTION_MAX}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
              <div className='space-y-1'>
                <div className='text-muted-foreground text-[11px] font-semibold tracking-wider uppercase'>
                  {t('composer.section')}
                </div>
                <p className='text-muted-foreground text-xs'>{t('composer.sectionHelp')}</p>
              </div>
              <div className='border-border bg-muted/30 space-y-3 rounded-xl border p-3.5'>
                <div className='space-y-1.5'>
                  <div id='inc-status-label' className='text-xs font-medium'>
                    {t('composer.statusLabel')}
                  </div>
                  <div role='group' aria-labelledby='inc-status-label' className='flex flex-wrap gap-1.5'>
                    {STATUSES.map((option) => {
                      const selected = composer.status === option;
                      return (
                        <button
                          key={option}
                          type='button'
                          aria-pressed={selected}
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
                </div>
                <Textarea
                  id='inc-message'
                  rows={3}
                  placeholder={t('composer.messagePlaceholder')}
                  value={composer.message}
                  maxLength={STATUS_PAGE_LIMITS.INCIDENT_UPDATE_MESSAGE_MAX}
                  onChange={(e) => setComposer((c) => ({ ...c, message: e.target.value }))}
                />
                <div className='flex flex-wrap items-end gap-2'>
                  <div className='space-y-1.5'>
                    <div className='text-xs font-medium'>{t('composer.time')}</div>
                    <DateTimePicker
                      value={new Date(composer.timeLocal)}
                      onChange={(date) => setComposer((c) => ({ ...c, timeLocal: toLocalInput(date) }))}
                      locale={locale}
                      dateLabel={t('composer.time')}
                      timeLabel={t('composer.time')}
                    />
                  </div>
                  <PermissionGate>
                    {(disabled) => (
                      <Button
                        size='sm'
                        onClick={stagePendingUpdate}
                        disabled={disabled || atUpdateCap || composerIsNoop}
                        className='ml-auto cursor-pointer'
                      >
                        <Plus className='h-3.5 w-3.5' />
                        {t('timeline.addUpdate')}
                      </Button>
                    )}
                  </PermissionGate>
                </div>
              </div>
            </section>

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
                ) : timelineRows.length === 0 ? (
                  <p className={cn('text-sm', showTimelineError ? 'text-destructive' : 'text-muted-foreground')}>
                    {showTimelineError ? t('form.timelineRequired') : t('timeline.empty')}
                  </p>
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
                            {pending && (
                              <span className='text-muted-foreground text-[11px]'>
                                {t('timeline.pendingLabel')}
                              </span>
                            )}
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
          </div>

          <SheetFooter className='flex-row flex-wrap items-center gap-2 border-t px-6 py-3'>
            {form.id != null && (
              <PermissionGate>
                {(disabled) => (
                  <Button
                    variant='ghost'
                    disabled={disabled || deleting}
                    onClick={() => {
                      onDelete(form.id as string);
                      onOpenChange(false);
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
          onOpenChange(false);
        }}
      />
    </>
  );
}
