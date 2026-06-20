'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
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
import { Link } from '@/i18n/navigation';
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
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { cn } from '@/lib/utils';
import { deleteStatusPageAction } from '@/app/actions/analytics/statusPage.actions';
import type { StatusPageListItem } from '@/entities/analytics/statusPage.entities';
import type { MonitorOperationalState } from '@/entities/analytics/monitoring.entities';
import { presentMonitorStatus } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import { MonitoringTooltip } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/[monitorId]/MonitoringTooltip';
import { StatusPagesEmptyState } from './StatusPagesEmptyState';
import { CreateStatusPageWizard } from './CreateStatusPageWizard';

const HEADER_GRID = 'grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1fr)_150px_80px]';
const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1fr)_150px_80px]';

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

  const [showWizard, setShowWizard] = useState(false);

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${publicBaseUrl}/status/${slug}`);
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

  const publicHost = publicBaseUrl.replace(/^https?:\/\//, '');

  const createButton = (label: string) =>
    atStatusPageLimit ? (
      <UpgradeButton>{t('upgradeToCreate')}</UpgradeButton>
    ) : (
      <PermissionGate>
        {(disabled) => (
          <Button disabled={disabled} onClick={() => setShowWizard(true)} className='cursor-pointer'>
            <Plus className='mr-1 h-4 w-4' />
            {label}
          </Button>
        )}
      </PermissionGate>
    );

  const wizard = showWizard && (
    <CreateStatusPageWizard
      dashboardId={dashboardId}
      publicHost={publicHost}
      publicBaseUrl={publicBaseUrl}
      domain={domain}
      onClose={() => setShowWizard(false)}
    />
  );

  if (statusPages.length === 0) {
    return (
      <>
        <StatusPagesEmptyState createButton={createButton(t('empty.cta'))} />
        {wizard}
      </>
    );
  }

  const incidentPages = statusPages.filter((page) => page.activeIncidentCount > 0);
  const hasIncidents = incidentPages.length > 0;

  return (
    <div className='space-y-4'>
      <DashboardHeader title={t('title')}>{createButton(t('newStatusPage'))}</DashboardHeader>

      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border px-4 py-3.5',
          hasIncidents ? 'border-amber-500/45 bg-amber-500/7' : 'border-emerald-500/40 bg-emerald-500/6',
        )}
      >
        {hasIncidents ? (
          <AlertTriangle className='h-4.5 w-4.5 shrink-0 text-amber-500' aria-hidden />
        ) : (
          <CheckCircle2 className='h-4.5 w-4.5 shrink-0 text-emerald-500' aria-hidden />
        )}
        <div className='min-w-0'>
          <div className='text-foreground text-sm font-semibold'>
            {hasIncidents
              ? t('banner.incidentTitle', { count: incidentPages.length })
              : t('banner.operationalTitle')}
          </div>
          <div className='text-muted-foreground mt-0.5 truncate text-xs'>
            {hasIncidents ? incidentPages.map((page) => page.name).join(', ') : t('banner.operationalDescription')}
          </div>
        </div>
      </div>

      <div className='bg-card border-border overflow-hidden rounded-xl border'>
        <div
          className={cn(
            'text-muted-foreground border-border hidden border-b px-5 py-2.5 text-[11px] font-semibold tracking-wider uppercase md:grid md:gap-4',
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
          const editorHref = `/dashboard/${dashboardId}/monitoring/status-pages/${page.id}`;
          const publicUrl = `${publicBaseUrl}/status/${page.slug}`;

          return (
            <div
              key={page.id}
              className={cn(
                'relative flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3.5 transition-colors last:border-b-0 md:items-center md:gap-4 md:px-5',
                ROW_GRID,
                isIncident ? 'bg-amber-500/6 hover:bg-amber-500/9' : 'hover:bg-muted/40',
              )}
            >
              {isIncident && <span aria-hidden className='absolute inset-y-0 left-0 w-0.75 bg-amber-500' />}

              <div className='min-w-0 basis-full pr-16 md:basis-auto md:pr-0'>
                <Link
                  href={editorHref}
                  className='text-foreground block truncate font-semibold after:absolute after:inset-0'
                >
                  {page.name}
                </Link>
              </div>

              <div className='text-muted-foreground flex items-center gap-1.5 text-[13px]'>
                {page.isPublished ? (
                  <Globe className='h-3.5 w-3.5 shrink-0' aria-hidden />
                ) : (
                  <Lock className='h-3.5 w-3.5 shrink-0' aria-hidden />
                )}
                <span>{page.isPublished ? t('badge.public') : t('badge.draft')}</span>
              </div>

              <div className='relative z-10 flex w-fit min-w-0 flex-wrap items-center gap-1.5'>
                {page.monitors.length === 0 ? (
                  <span className='text-muted-foreground/70 text-xs'>{t('monitorsEmpty')}</span>
                ) : (
                  page.monitors.map((monitor, index) => {
                    const presentation = presentMonitorStatus(
                      monitorStatuses[monitor.monitorCheckId] ?? 'preparing',
                    );
                    const statusLabel = tStatus(presentation.labelKey);
                    return (
                      <MonitoringTooltip
                        key={`${monitor.monitorCheckId}-${index}`}
                        title={t('monitorLabel')}
                        description={monitor.publicName}
                      >
                        <span
                          aria-label={`${monitor.publicName} — ${statusLabel}`}
                          className={cn(
                            'h-2 w-2 shrink-0 cursor-pointer rounded-full transition-transform hover:scale-150',
                            presentation.theme.dot,
                          )}
                        />
                      </MonitoringTooltip>
                    );
                  })
                )}
              </div>

              <div className='flex items-center gap-2 text-[13px] whitespace-nowrap'>
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
                      <>
                        <DropdownMenuItem asChild className='cursor-pointer'>
                          <a href={publicUrl} target='_blank' rel='noopener noreferrer'>
                            <ExternalLink className='mr-2 h-4 w-4' />
                            {t('actions.viewPublicPage')}
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => copyLink(page.slug)} className='cursor-pointer'>
                          <Copy className='mr-2 h-4 w-4' />
                          {t('actions.copyUrl')}
                        </DropdownMenuItem>
                      </>
                    )}
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
      {wizard}
    </div>
  );
}
