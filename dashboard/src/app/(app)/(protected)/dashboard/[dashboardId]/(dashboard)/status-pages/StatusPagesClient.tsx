'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Globe,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { StatusPageBrandAvatar } from '@/components/statusPage/StatusPageBrandAvatar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { cn } from '@/lib/utils';
import { deleteStatusPageAction, setStatusPagePublishedAction } from '@/app/actions/analytics/statusPage.actions';
import type { StatusPageListItem } from '@/entities/analytics/statusPage/statusPage.entities';
import { statusPagePublicUrl, statusPagePublicUrlLabel } from '@/entities/analytics/statusPage/statusPage.helpers';
import type { MonitorOperationalState } from '@/entities/analytics/monitoring.entities';
import {
  MONITOR_TONE,
  presentMonitorStatus,
  type MonitorTone,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import { MonitoringTooltip } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/[monitorId]/MonitoringTooltip';
import { StatusPagesEmptyState } from './StatusPagesEmptyState';
import { CreateStatusPageStudio } from './studio/CreateStatusPageStudio';

const HEADER_GRID = 'grid-cols-[minmax(0,1fr)_150px_170px_150px_80px]';
const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_150px_170px_150px_80px]';

function summarizeMonitorHealth(states: MonitorOperationalState[]): {
  upCount: number;
  total: number;
  tone: MonitorTone;
} {
  const upCount = states.filter((state) => state === 'up').length;

  let tone: MonitorTone = 'neutral';
  if (states.includes('down')) {
    tone = 'down';
  } else if (states.includes('degraded')) {
    tone = 'warn';
  } else if (upCount > 0) {
    tone = 'ok';
  }

  return { upCount, total: states.length, tone };
}

type StatusPagesClientProps = {
  dashboardId: string;
  statusPages: StatusPageListItem[];
  monitorStatuses: Record<string, MonitorOperationalState>;
  publicBaseUrl: string;
  domain: string;
};

export function StatusPagesClient({
  dashboardId,
  statusPages,
  monitorStatuses,
  publicBaseUrl,
  domain,
}: StatusPagesClientProps) {
  const t = useTranslations('statusPagesPage');
  const tStatus = useTranslations('monitoring.status');
  const router = useRouter();
  const { caps } = useCapabilities();
  const atStatusPageLimit = statusPages.length >= caps.statusPages.maxStatusPages;

  const [showCreateStudio, setShowCreateStudio] = useState(false);

  const copyLink = (page: StatusPageListItem) => {
    navigator.clipboard.writeText(statusPagePublicUrl(page, publicBaseUrl));
    toast.success(t('actions.linkCopied'));
  };

  const [deleteTarget, setDeleteTarget] = useState<StatusPageListItem | null>(null);
  const deleteMutation = useMutation({
    mutationFn: async (statusPageId: string) => deleteStatusPageAction(dashboardId, statusPageId),
    onSuccess: () => {
      toast.success(t('editor.deleted'));
      setDeleteTarget(null);
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const [publishTarget, setPublishTarget] = useState<StatusPageListItem | null>(null);
  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      setStatusPagePublishedAction(dashboardId, id, isPublished),
    onSuccess: (_result, { isPublished }) => {
      toast.success(isPublished ? t('actions.publishedToast') : t('actions.unpublishedToast'));
      setPublishTarget(null);
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const publicHost = publicBaseUrl.replace(/^https?:\/\//, '');

  const createButton = (label: string) =>
    atStatusPageLimit ? (
      <UpgradeButton>{t('upgradeToCreate')}</UpgradeButton>
    ) : (
      <PermissionGate>
        {(disabled) => (
          <Button disabled={disabled} onClick={() => setShowCreateStudio(true)} className='cursor-pointer'>
            <Plus className='mr-1 h-4 w-4' />
            {label}
          </Button>
        )}
      </PermissionGate>
    );

  const createStudio = showCreateStudio && (
    <CreateStatusPageStudio
      dashboardId={dashboardId}
      publicHost={publicHost}
      publicBaseUrl={publicBaseUrl}
      domain={domain}
      onClose={() => setShowCreateStudio(false)}
    />
  );

  if (statusPages.length === 0) {
    return (
      <>
        <StatusPagesEmptyState createButton={createButton(t('empty.cta'))} />
        {createStudio}
      </>
    );
  }

  const incidentPages = statusPages.filter((page) => page.activeIncidentCount > 0);
  const hasIncidents = incidentPages.length > 0;

  return (
    <div className='space-y-4'>
      <DashboardHeader title={t('title')}>{createButton(t('newStatusPage'))}</DashboardHeader>

      {hasIncidents && (
        <div className='flex items-center gap-3 rounded-xl border border-amber-500/45 bg-amber-500/7 px-4 py-3.5'>
          <AlertTriangle className='h-4.5 w-4.5 shrink-0 text-amber-500' aria-hidden />
          <div className='min-w-0 flex-1'>
            <div className='text-foreground text-sm font-semibold'>
              {t('banner.incidentTitle', { count: incidentPages.length })}
            </div>
            {incidentPages.length === 1 ? (
              <div className='text-muted-foreground mt-0.5 truncate text-xs'>{incidentPages[0].name}</div>
            ) : (
              <div className='mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs'>
                {incidentPages.map((page, index) => (
                  <span key={page.id}>
                    <Link
                      href={`/dashboard/${dashboardId}/status-pages/${page.id}`}
                      className='font-medium text-amber-600 hover:underline dark:text-amber-400'
                    >
                      {page.name}
                    </Link>
                    {index < incidentPages.length - 1 && <span className='text-muted-foreground'>,</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
          {incidentPages.length === 1 && (
            <Button asChild variant='outline' size='sm' className='shrink-0'>
              <Link href={`/dashboard/${dashboardId}/status-pages/${incidentPages[0].id}`}>
                {t('banner.viewIncidents')}
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className='bg-card border-border overflow-hidden rounded-xl border'>
        <div
          className={cn(
            'text-muted-foreground border-border hidden border-b px-5 py-2.5 text-xs font-semibold tracking-wider uppercase md:grid md:gap-6',
            HEADER_GRID,
          )}
        >
          <div>{t('table.statusPage')}</div>
          <div>{t('table.visibility')}</div>
          <div>{t('table.monitors')}</div>
          <div>{t('table.status')}</div>
          <div />
        </div>

        {statusPages.map((page) => {
          const isIncident = page.activeIncidentCount > 0;
          const editorHref = `/dashboard/${dashboardId}/status-pages/${page.id}`;
          const publicUrl = statusPagePublicUrl(page, publicBaseUrl);
          const monitorStates = page.monitors.map(
            (monitor) => monitorStatuses[monitor.monitorCheckId] ?? 'preparing',
          );
          const health = summarizeMonitorHealth(monitorStates);
          const healthTheme = MONITOR_TONE[health.tone];

          return (
            <div
              key={page.id}
              className={cn(
                'relative flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3.5 transition-colors last:border-b-0 md:items-center md:gap-6 md:px-5',
                ROW_GRID,
                isIncident ? 'bg-amber-500/6 hover:bg-amber-500/9' : 'hover:bg-muted/40',
              )}
            >
              {isIncident && <span aria-hidden className='absolute inset-y-0 left-0 w-0.75 bg-amber-500' />}

              <div className='flex min-w-0 basis-full items-center gap-3 pr-16 md:basis-auto md:pr-0'>
                <StatusPageBrandAvatar
                  name={page.name}
                  imageUrl={page.faviconUrl}
                  accentColor={page.accentColor}
                  imageFit='cover'
                  className='border-border/60 bg-background h-9 w-9 rounded-lg border text-sm'
                />
                <div className='min-w-0'>
                  <Link
                    href={editorHref}
                    className='text-foreground block min-w-0 truncate text-sm font-semibold after:absolute after:inset-0'
                  >
                    {page.name}
                  </Link>
                  <span className='text-muted-foreground block truncate text-xs'>
                    {statusPagePublicUrlLabel(page)}
                  </span>
                </div>
              </div>

              <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                {page.isPublished ? (
                  <Globe className='h-3.5 w-3.5 shrink-0' aria-hidden />
                ) : (
                  <Lock className='h-3.5 w-3.5 shrink-0' aria-hidden />
                )}
                <span>{page.isPublished ? t('badge.public') : t('badge.draft')}</span>
              </div>

              <div className='relative z-10 min-w-0'>
                {health.total === 0 ? (
                  <span className='text-muted-foreground/70 text-xs'>{t('monitorsEmpty')}</span>
                ) : (
                  <div className='flex flex-col gap-1.5'>
                    <div className='flex items-baseline gap-1.5 text-xs'>
                      <span className={cn('font-semibold tabular-nums', healthTheme.text)}>
                        {health.upCount}/{health.total}
                      </span>
                      <span className='text-muted-foreground'>{t('monitorsUp')}</span>
                    </div>
                    <div className='flex h-1.5 w-20 gap-0.5 overflow-hidden rounded-full'>
                      {page.monitors.map((monitor, index) => {
                        const presentation = presentMonitorStatus(monitorStates[index]);
                        const statusLabel = tStatus(presentation.labelKey);
                        return (
                          <MonitoringTooltip key={`${monitor.monitorCheckId}-${index}`} title={monitor.publicName}>
                            <span
                              aria-label={`${monitor.publicName} — ${statusLabel}`}
                              className={cn(
                                'h-full min-w-0 flex-1 cursor-pointer transition-opacity hover:opacity-80',
                                presentation.theme.dot,
                              )}
                            />
                          </MonitoringTooltip>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className='flex items-center gap-2 text-xs whitespace-nowrap'>
                <span
                  className={cn('h-2 w-2 shrink-0 rounded-full', isIncident ? 'bg-amber-500' : 'bg-emerald-500')}
                  aria-hidden
                />
                <span className={isIncident ? 'font-medium text-amber-500' : 'text-muted-foreground'}>
                  {isIncident ? t('status.ongoingIncident') : t('status.operational')}
                </span>
              </div>

              <div
                className='absolute top-3 right-3 z-10 flex items-center gap-0.5 md:static md:justify-self-end'
                onClick={(e) => e.stopPropagation()}
              >
                {page.isPublished && (
                  <Button
                    variant='ghost'
                    size='icon'
                    asChild
                    className='text-muted-foreground hover:text-foreground h-8 w-8'
                  >
                    <a
                      href={publicUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={t('actions.openPublicPage')}
                    >
                      <ExternalLink className='h-4 w-4' />
                    </a>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer'
                      aria-label={t('actions.more')}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link href={editorHref}>
                        <Pencil className='mr-2 h-4 w-4' />
                        {t('actions.editPage')}
                      </Link>
                    </DropdownMenuItem>
                    {page.isPublished && (
                      <DropdownMenuItem onSelect={() => copyLink(page)} className='cursor-pointer'>
                        <Copy className='mr-2 h-4 w-4' />
                        {t('actions.copyUrl')}
                      </DropdownMenuItem>
                    )}
                    <PermissionGate>
                      {(disabled) => (
                        <DropdownMenuItem
                          disabled={disabled}
                          onSelect={() => setPublishTarget(page)}
                          className='cursor-pointer'
                        >
                          {page.isPublished ? (
                            <Lock className='mr-2 h-4 w-4' />
                          ) : (
                            <Globe className='mr-2 h-4 w-4' />
                          )}
                          {page.isPublished ? t('actions.unpublish') : t('actions.publish')}
                        </DropdownMenuItem>
                      )}
                    </PermissionGate>
                    <DropdownMenuSeparator />
                    <PermissionGate>
                      {(disabled) => (
                        <DropdownMenuItem
                          disabled={disabled}
                          variant='destructive'
                          onSelect={() => setDeleteTarget(page)}
                          className='cursor-pointer'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          {t('editor.delete')}
                        </DropdownMenuItem>
                      )}
                    </PermissionGate>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('editor.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('editor.deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>{t('editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className='bg-destructive hover:bg-destructive/90 cursor-pointer text-white'
            >
              {t('editor.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={publishTarget != null} onOpenChange={(open) => !open && setPublishTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {publishTarget?.isPublished ? t('actions.unpublishConfirmTitle') : t('actions.publishConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {publishTarget?.isPublished
                ? t('actions.unpublishConfirmDescription')
                : t('actions.publishConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>{t('editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={publishMutation.isPending}
              onClick={() =>
                publishTarget &&
                publishMutation.mutate({ id: publishTarget.id, isPublished: !publishTarget.isPublished })
              }
              className='cursor-pointer'
            >
              {publishTarget?.isPublished ? t('actions.unpublish') : t('actions.publish')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {createStudio}
    </div>
  );
}
