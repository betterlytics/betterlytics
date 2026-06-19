'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity, Check, Lock, MoreHorizontal, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatElapsedTime, formatLocalDateTime, formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import {
  STATUS_PAGE_LIMITS,
  type DetectedOutageSuggestion,
  type StatusPageIncident,
  type StatusPageIncidentImpact,
  type StatusPageIncidentStatusValue,
} from '@/entities/analytics/statusPage.entities';
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

const IMPACTS: StatusPageIncidentImpact[] = ['degraded', 'outage'];
const STATUSES: StatusPageIncidentStatusValue[] = ['investigating', 'identified', 'monitoring', 'resolved'];

// One colored chip per row — the current lifecycle status. Everything else stays neutral so the
// status reads at a glance (see the design's "single clear indicator" refinement).
const STATUS_PILL: Record<StatusPageIncidentStatusValue, string> = {
  investigating: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  identified: 'bg-orange-500/12 text-orange-600 dark:text-orange-400',
  monitoring: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  resolved: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
};

// Impact selector in the modal: muted by default, tinted when picked.
const IMPACT_SELECTED: Record<StatusPageIncidentImpact, string> = {
  degraded: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  outage: 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400',
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

  const incidents = incidentsQuery.data ?? [];
  const suggestions = suggestionsQuery.data ?? [];
  const formValid = form.title.trim().length > 0 && form.body.trim().length > 0 && form.startedAtLocal.length > 0;
  const editingPublished = form.id != null && form.isPublished;
  const publishCta = editingPublished ? t('form.updatePublic') : t('form.publishCta');

  return (
    <div className='space-y-6'>
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

      {/* Past incidents header */}
      <div className='flex items-end justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold'>{t('pastIncidents')}</h2>
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

      {/* List */}
      <div className='bg-card border-border overflow-hidden rounded-xl border'>
        {incidents.length === 0 ? (
          <div className='flex flex-col items-center justify-center px-6 py-16 text-center'>
            <span className='bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full'>
              <Activity className='h-5 w-5' />
            </span>
            <p className='text-foreground mt-3 text-sm font-medium'>{t('noIncidents')}</p>
            <p className='text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed'>{t('emptyHint')}</p>
          </div>
        ) : (
          incidents.map((incident, index) => {
            const resolved = incident.resolvedAt != null;
            const durationMs = incident.resolvedAt
              ? new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()
              : null;
            // formatElapsedTime renders the compact "2d 14h" / "45m" shape; feed it a synthetic start
            // so it formats a fixed duration rather than time-from-now.
            const duration = resolved
              ? formatElapsedTime(new Date(Date.now() - (durationMs ?? 0)), locale)
              : t('ongoingFor', { duration: formatElapsedTime(new Date(incident.startedAt), locale) });
            const startedLabel = formatLocalDateTime(incident.startedAt, locale, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={incident.id}
                onClick={() => openEdit(incident)}
                className={cn(
                  'group hover:bg-muted/40 flex cursor-pointer items-center gap-4 px-4 py-3.5 transition-colors',
                  index > 0 && 'border-border border-t',
                )}
              >
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-foreground truncate text-sm font-medium'>{incident.title}</span>
                    {!incident.isPublished && (
                      <span className='border-border text-muted-foreground inline-flex flex-none items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold'>
                        <Lock className='h-2.5 w-2.5' />
                        {t('internal')}
                      </span>
                    )}
                  </div>
                  {incident.body && <p className='text-muted-foreground mt-0.5 truncate text-xs'>{incident.body}</p>}
                </div>

                <div suppressHydrationWarning className='hidden w-32 flex-none text-right sm:block'>
                  <div className='text-muted-foreground text-xs'>{startedLabel}</div>
                  <div className='text-muted-foreground/75 mt-0.5 text-xs'>{duration}</div>
                </div>

                <div className='w-24 flex-none'>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      STATUS_PILL[incident.status],
                    )}
                  >
                    {t(`status.${incident.status}`)}
                  </span>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <PermissionGate hideWhenDisabled>
                    {() => (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size='icon'
                            variant='ghost'
                            disabled={publishMutation.isPending || deleteMutation.isPending}
                            aria-label={t('actions')}
                            className='text-muted-foreground hover:text-foreground h-8 w-8 flex-none cursor-pointer'
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
                </div>
              </div>
            );
          })
        )}
      </div>

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
