'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatElapsedTime, formatLocalDateTime, formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { FlowOverlay } from './FlowOverlay';
import { FlowOverlayHeader } from './FlowOverlayHeader';
import {
  STATUS_PAGE_LIMITS,
  type DetectedOutageSuggestion,
  type PublicStatusPageIncident,
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

type IncidentsManagerProps = {
  dashboardId: string;
  statusPageId: string;
  monitors: MonitorOption[];
  onDraftIncidentChange?: (incident: PublicStatusPageIncident | null) => void;
};

const IMPACTS: StatusPageIncidentImpact[] = ['degraded', 'outage'];
const STATUSES: StatusPageIncidentStatusValue[] = ['investigating', 'identified', 'monitoring', 'resolved'];

const SEVERITY_DOT: Record<StatusPageIncidentImpact, string> = {
  outage: 'bg-rose-500',
  degraded: 'bg-amber-500',
};

const LIFECYCLE_DOT: Record<StatusPageIncidentStatusValue, string> = {
  investigating: 'bg-amber-500',
  identified: 'bg-orange-500',
  monitoring: 'bg-sky-500',
  resolved: 'bg-emerald-500',
};

const IMPACT_BADGE: Record<StatusPageIncidentImpact, string> = {
  degraded: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  outage: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
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

export function IncidentsManager({
  dashboardId,
  statusPageId,
  monitors,
  onDraftIncidentChange,
}: IncidentsManagerProps) {
  const t = useTranslations('statusPagesPage.editor.incidents');
  const locale = useLocale() as SupportedLanguages;
  const router = useRouter();
  const queryClient = useQueryClient(
  );

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

  const monitorNameById = new Map(monitors.map((monitor) => [monitor.monitorCheckId, monitor.publicName]));

  useEffect(() => {
    if (!onDraftIncidentChange) return;
    if (!open) {
      onDraftIncidentChange(null);
      return;
    }
    onDraftIncidentChange({
      title: form.title.trim(),
      body: form.body.trim(),
      impact: form.impact,
      status: form.status,
      monitorPublicName: form.monitorCheckId ? (monitorNameById.get(form.monitorCheckId) ?? null) : null,
      startedAt: form.startedAtLocal ? new Date(form.startedAtLocal).toISOString() : new Date().toISOString(),
      resolvedAt: form.resolvedAtLocal ? new Date(form.resolvedAtLocal).toISOString() : null,
    });
    // monitorNameById is derived from `monitors`, so depend on that instead of the fresh Map identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form, monitors, onDraftIncidentChange]);

  // Clear the preview draft when this tab unmounts.
  useEffect(() => () => onDraftIncidentChange?.(null), [onDraftIncidentChange]);

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

  if (open) {
    return (
      <FlowOverlay>
        <FlowOverlayHeader
          title={form.id ? t('editIncident') : t('newIncident')}
          closeAriaLabel={t('form.cancel')}
          onClose={() => setOpen(false)}
          actions={
            <>
              <Button variant='outline' size='sm' onClick={() => setOpen(false)} className='cursor-pointer'>
                {t('form.cancel')}
              </Button>
              <PermissionGate>
                {(disabled) => (
                  <Button
                    size='sm'
                    disabled={disabled || !formValid || saveMutation.isPending}
                    onClick={() => saveMutation.mutate(form)}
                    className='cursor-pointer'
                  >
                    {t('form.save')}
                  </Button>
                )}
              </PermissionGate>
            </>
          }
        />
        <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10'>
          <div className='space-y-1'>
            <h2 className='text-lg font-semibold'>{form.id ? t('editIncident') : t('newIncident')}</h2>
            <p className='text-muted-foreground text-sm'>{t('formHint')}</p>
          </div>

          <div className='mt-7 space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='inc-title'>{t('form.title')}</Label>
              <Input
                id='inc-title'
                autoFocus
                value={form.title}
                maxLength={STATUS_PAGE_LIMITS.INCIDENT_TITLE_MAX}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='inc-body'>{t('form.body')}</Label>
              <Textarea
                id='inc-body'
                rows={5}
                value={form.body}
                maxLength={STATUS_PAGE_LIMITS.INCIDENT_BODY_MAX}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label>{t('form.impact')}</Label>
                <Select
                  value={form.impact}
                  onValueChange={(value) => setForm((f) => ({ ...f, impact: value as StatusPageIncidentImpact }))}
                >
                  <SelectTrigger className='w-full cursor-pointer'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPACTS.map((value) => (
                      <SelectItem key={value} value={value} className='cursor-pointer'>
                        {t(`impact.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1.5'>
                <Label>{t('form.status')}</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm((f) => ({ ...f, status: value as StatusPageIncidentStatusValue }))}
                >
                  <SelectTrigger className='w-full cursor-pointer'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((value) => (
                      <SelectItem key={value} value={value} className='cursor-pointer'>
                        {t(`status.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label>{t('form.monitor')}</Label>
              <Select
                value={form.monitorCheckId ?? 'none'}
                onValueChange={(value) => setForm((f) => ({ ...f, monitorCheckId: value === 'none' ? null : value }))}
              >
                <SelectTrigger className='w-full cursor-pointer'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none' className='cursor-pointer'>
                    {t('form.monitorNone')}
                  </SelectItem>
                  {monitors.map((monitor) => (
                    <SelectItem key={monitor.monitorCheckId} value={monitor.monitorCheckId} className='cursor-pointer'>
                      {monitor.publicName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className='border-border flex items-center justify-between rounded-lg border p-4'>
              <div>
                <Label htmlFor='inc-published'>{t('form.publish')}</Label>
                <p className='text-muted-foreground text-xs'>{t('form.publishHint')}</p>
              </div>
              <Switch
                id='inc-published'
                checked={form.isPublished}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isPublished: checked }))}
              />
            </div>
          </div>
        </div>
        </div>
      </FlowOverlay>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-baseline justify-between'>
        <div>
          <h2 className='font-semibold'>{t('title')}</h2>
          <p className='text-muted-foreground text-xs'>{t('hint')}</p>
        </div>
        <PermissionGate>
          {(disabled) => (
            <Button size='sm' disabled={disabled} onClick={openCreate} className='flex-none cursor-pointer'>
              <Plus className='mr-1 h-3.5 w-3.5' />
              {t('newIncident')}
            </Button>
          )}
        </PermissionGate>
      </div>

      {suggestions.length > 0 && (
        <div className='rounded-lg border border-amber-500/30 bg-amber-500/[0.07] p-4'>
          <div className='flex items-center gap-2'>
            <TriangleAlert className='h-4 w-4 text-amber-500' />
            <span className='text-[11px] font-bold tracking-wide text-amber-600 uppercase dark:text-amber-400'>
              {t('suggestionsTitle')}
            </span>
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>{t('suggestionsHint')}</p>
          <div className='mt-1 divide-y divide-amber-500/15'>
            {suggestions.map((suggestion) => (
              <div key={suggestion.detectedIncidentId} className='flex items-center justify-between gap-3 py-2.5'>
                <div className='flex min-w-0 items-center gap-2.5'>
                  <span className='flex h-7 w-7 flex-none items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400'>
                    <TriangleAlert className='h-3.5 w-3.5' />
                  </span>
                  <div className='min-w-0'>
                    <div className='text-foreground truncate text-sm font-medium'>{suggestion.monitorPublicName}</div>
                    <div suppressHydrationWarning className='text-muted-foreground truncate text-xs'>
                      {suggestion.ongoing
                        ? t('ongoingSince', { date: formatRelativeTimeFromNow(suggestion.startedAt, locale) })
                        : new Date(suggestion.startedAt).toLocaleString(locale)}
                    </div>
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
            ))}
          </div>
        </div>
      )}

      <div className='border-border overflow-x-auto rounded-lg border'>
        <Table className='min-w-[620px]'>
          <TableHeader>
            <TableRow className='border-border bg-muted/50 hover:bg-muted/50'>
              <TableHead className='text-foreground px-4 py-2.5 text-xs font-medium'>{t('table.incident')}</TableHead>
              <TableHead className='text-foreground px-4 py-2.5 text-xs font-medium'>{t('table.status')}</TableHead>
              <TableHead className='text-foreground px-4 py-2.5 text-xs font-medium'>{t('table.impact')}</TableHead>
              <TableHead className='text-foreground hidden px-4 py-2.5 text-xs font-medium xl:table-cell'>
                {t('table.affected')}
              </TableHead>
              <TableHead className='text-foreground px-4 py-2.5 text-xs font-medium'>{t('table.started')}</TableHead>
              <TableHead className='w-10 px-2' />
            </TableRow>
          </TableHeader>
          <TableBody className='divide-border divide-y'>
            {incidents.length === 0 ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={6} className='py-14'>
                  <div className='flex flex-col items-center justify-center text-center'>
                    <span className='bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full'>
                      <Activity className='h-5 w-5' />
                    </span>
                    <p className='text-foreground mt-3 text-sm font-medium'>{t('noIncidents')}</p>
                    <p className='text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed'>{t('emptyHint')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              incidents.map((incident) => {
                const resolved = incident.resolvedAt != null;
                const monitorName = incident.monitorCheckId ? monitorNameById.get(incident.monitorCheckId) : null;
                const monitorLabel = monitorName ?? t('pageWide');
                const durationMs = incident.resolvedAt
                  ? new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()
                  : null;
                // formatElapsedTime renders the compact "2d 14h" / "45m" shape; feed it a synthetic start
                // so it formats a fixed duration rather than time-from-now.
                const timePart = resolved
                  ? t('lasted', { duration: formatElapsedTime(new Date(Date.now() - (durationMs ?? 0)), locale) })
                  : t('ongoingFor', { duration: formatElapsedTime(new Date(incident.startedAt), locale) });
                const startedLabel = formatLocalDateTime(incident.startedAt, locale, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <TableRow
                    key={incident.id}
                    onClick={() => openEdit(incident)}
                    className='group hover:bg-accent dark:hover:bg-primary/10 cursor-pointer'
                  >
                    <TableCell className='w-full max-w-0 min-w-[180px] px-4 py-3 align-middle'>
                      <div className='flex items-center gap-2'>
                        <span
                          className={cn(
                            'size-2 flex-none rounded-full',
                            resolved ? 'bg-emerald-500' : SEVERITY_DOT[incident.impact],
                          )}
                          aria-hidden
                        />
                        <span className='text-foreground truncate text-sm font-medium'>{incident.title}</span>
                        {!incident.isPublished && (
                          <Badge variant='secondary' className='flex-none px-1.5 py-0 text-[10px] font-semibold'>
                            {t('draft')}
                          </Badge>
                        )}
                      </div>
                      {incident.body && (
                        <p className='text-muted-foreground mt-0.5 truncate pl-4 text-xs'>{incident.body}</p>
                      )}
                    </TableCell>
                    <TableCell className='px-4 py-3 align-middle'>
                      <Badge variant='outline' className='gap-1.5 font-medium'>
                        <span className={cn('size-1.5 rounded-full', LIFECYCLE_DOT[incident.status])} aria-hidden />
                        {t(`status.${incident.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className='px-4 py-3 align-middle'>
                      <Badge variant='outline' className={cn('font-medium', IMPACT_BADGE[incident.impact])}>
                        {t(`impact.${incident.impact}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden max-w-[160px] truncate px-4 py-3 align-middle text-sm xl:table-cell'>
                      {monitorLabel}
                    </TableCell>
                    <TableCell className='px-4 py-3 align-middle'>
                      <div suppressHydrationWarning className='text-foreground text-sm whitespace-nowrap'>
                        {startedLabel}
                      </div>
                      <div suppressHydrationWarning className='text-muted-foreground text-xs whitespace-nowrap'>
                        {timePart}
                      </div>
                    </TableCell>
                    <TableCell className='w-10 px-2 align-middle' onClick={(e) => e.stopPropagation()}>
                      <PermissionGate hideWhenDisabled>
                        {() => (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size='icon'
                                variant='ghost'
                                disabled={publishMutation.isPending || deleteMutation.isPending}
                                aria-label={t('actions')}
                                className='text-muted-foreground hover:text-foreground h-7 w-7 cursor-pointer focus:opacity-100 data-[state=open]:opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
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
                                {incident.isPublished ? (
                                  <EyeOff className='h-3.5 w-3.5' />
                                ) : (
                                  <Eye className='h-3.5 w-3.5' />
                                )}
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
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
