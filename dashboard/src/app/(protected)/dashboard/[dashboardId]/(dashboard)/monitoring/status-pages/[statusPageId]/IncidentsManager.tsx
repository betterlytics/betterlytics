'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

type IncidentsManagerProps = {
  dashboardId: string;
  statusPageId: string;
  monitors: MonitorOption[];
};

const IMPACTS: StatusPageIncidentImpact[] = ['degraded', 'outage'];
const STATUSES: StatusPageIncidentStatusValue[] = ['investigating', 'identified', 'monitoring', 'resolved'];

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

export function IncidentsManager({ dashboardId, statusPageId, monitors }: IncidentsManagerProps) {
  const t = useTranslations('statusPagesPage.editor.incidents');
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

  const monitorNameById = new Map(monitors.map((monitor) => [monitor.monitorCheckId, monitor.publicName]));

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

  return (
    <section className='bg-card border-border space-y-4 rounded-xl border p-5'>
      <div className='flex items-baseline justify-between'>
        <div>
          <h2 className='font-semibold'>{t('title')}</h2>
          <p className='text-muted-foreground text-xs'>{t('hint')}</p>
        </div>
        <PermissionGate>
          {(disabled) => (
            <Button size='sm' variant='outline' disabled={disabled} onClick={openCreate} className='cursor-pointer'>
              <Plus className='mr-1 h-3.5 w-3.5' />
              {t('newIncident')}
            </Button>
          )}
        </PermissionGate>
      </div>

      {suggestions.length > 0 && (
        <div className='border-border space-y-2 rounded-lg border border-dashed p-3'>
          <div className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium'>
            <Sparkles className='h-3.5 w-3.5' />
            {t('suggestionsTitle')}
          </div>
          {suggestions.map((suggestion) => (
            <div key={suggestion.detectedIncidentId} className='flex items-center justify-between gap-3 text-sm'>
              <div className='min-w-0'>
                <span className='font-medium'>{suggestion.monitorPublicName}</span>
                <span className='text-muted-foreground'>
                  {' · '}
                  {suggestion.ongoing
                    ? t('ongoingSince', { date: new Date(suggestion.startedAt).toLocaleString() })
                    : new Date(suggestion.startedAt).toLocaleString()}
                </span>
              </div>
              <PermissionGate>
                {(disabled) => (
                  <Button
                    size='sm'
                    variant='ghost'
                    disabled={disabled}
                    onClick={() => openFromSuggestion(suggestion)}
                    className='flex-none cursor-pointer'
                  >
                    {t('createFromSuggestion')}
                  </Button>
                )}
              </PermissionGate>
            </div>
          ))}
        </div>
      )}

      <div className='space-y-2'>
        {incidents.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{t('noIncidents')}</p>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className='border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center'
            >
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-sm font-medium'>{incident.title}</span>
                  <span
                    className={`flex-none rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      incident.isPublished
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {incident.isPublished ? t('published') : t('draft')}
                  </span>
                </div>
                <div className='text-muted-foreground truncate text-xs'>
                  {t(`status.${incident.status}`)} · {t(`impact.${incident.impact}`)}
                  {incident.monitorCheckId && monitorNameById.has(incident.monitorCheckId)
                    ? ` · ${monitorNameById.get(incident.monitorCheckId)}`
                    : ''}
                </div>
              </div>
              <div className='flex flex-none items-center gap-1'>
                <PermissionGate>
                  {(disabled) => (
                    <>
                      <Button
                        size='sm'
                        variant='ghost'
                        disabled={disabled}
                        onClick={() => openEdit(incident)}
                        className='cursor-pointer'
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={disabled || publishMutation.isPending}
                        onClick={() =>
                          publishMutation.mutate({ incidentId: incident.id, isPublished: !incident.isPublished })
                        }
                        className='cursor-pointer'
                      >
                        {incident.isPublished ? t('unpublish') : t('publish')}
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        disabled={disabled || deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(incident.id)}
                        aria-label={t('delete')}
                        className='text-muted-foreground hover:text-destructive cursor-pointer'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </>
                  )}
                </PermissionGate>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{form.id ? t('editIncident') : t('newIncident')}</DialogTitle>
            <DialogDescription>{t('formHint')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='inc-title'>{t('form.title')}</Label>
              <Input
                id='inc-title'
                value={form.title}
                maxLength={STATUS_PAGE_LIMITS.INCIDENT_TITLE_MAX}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
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
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label>{t('form.impact')}</Label>
                <Select
                  value={form.impact}
                  onValueChange={(value) => setForm((f) => ({ ...f, impact: value as StatusPageIncidentImpact }))}
                >
                  <SelectTrigger className='cursor-pointer'>
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
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, status: value as StatusPageIncidentStatusValue }))
                  }
                >
                  <SelectTrigger className='cursor-pointer'>
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
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, monitorCheckId: value === 'none' ? null : value }))
                }
              >
                <SelectTrigger className='cursor-pointer'>
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
            <div className='grid gap-3 sm:grid-cols-2'>
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
            <div className='flex items-center gap-2 pt-1'>
              <Switch
                id='inc-published'
                checked={form.isPublished}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isPublished: checked }))}
              />
              <Label htmlFor='inc-published'>{t('form.publish')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)} className='cursor-pointer'>
              {t('form.cancel')}
            </Button>
            <Button
              disabled={!formValid || saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}
              className='cursor-pointer'
            >
              {t('form.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
