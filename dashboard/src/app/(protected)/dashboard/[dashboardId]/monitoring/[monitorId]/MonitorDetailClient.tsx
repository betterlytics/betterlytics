'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, PauseCircle, Pencil, PlayCircle } from 'lucide-react';
import { presentMonitorStatus } from '@/app/(protected)/dashboard/[dashboardId]/monitoring/monitoringStyles';
import {
  fetchLatestMonitorTlsResultAction,
  fetchMonitorCheckAction,
  fetchMonitorIncidentsAction,
  fetchMonitorMetricsAction,
  fetchRecentMonitorResultsAction,
} from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import {
  type MonitorCheck,
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorOperationalState,
  type MonitorResult,
  type MonitorTlsResult,
} from '@/entities/analytics/monitoring.entities';
import { type PresentedMonitorUptime } from '@/presenters/toMonitorUptimeDays';
import { useMonitorMutations } from './(EditMonitorSheet)/useMonitorMutations';
import { EditMonitorDialog } from './(EditMonitorSheet)/EditMonitorSheet';
import { IncidentsCard, RecentChecksCard, ResponseTimeCard, Uptime180DayCard } from './MonitoringSections';
import { MonitorSummaryTiles } from './MonitorSummaryTiles';
import { useTranslations } from 'next-intl';
import { MonitorStatusBadge } from '../components/MonitorStatusBadge';
import { Label } from '@/components/ui/label';

type MonitorDetailClientProps = {
  dashboardId: string;
  monitorId: string;
  hostname: string;
  initialData: {
    monitor: MonitorCheck;
    metrics?: MonitorMetrics;
    incidents: MonitorIncidentSegment[];
    recentChecks: MonitorResult[];
    tls: MonitorTlsResult | null;
    uptime: PresentedMonitorUptime;
  };
};

const CRITICAL_POLLING_INTERVAL_MS = 35_000;
const NON_CRITICAL_POLLING_INTERVAL_MS = 60 * 60_000;

export function MonitorDetailClient({ dashboardId, monitorId, hostname, initialData }: MonitorDetailClientProps) {
  const tDetail = useTranslations('monitoringDetailPage');
  const tActions = useTranslations('monitoring.actions');
  const monitorQuery = useQuery({
    queryKey: ['monitor', dashboardId, monitorId],
    queryFn: () => fetchMonitorCheckAction(dashboardId, monitorId),
    initialData: initialData.monitor,
    refetchInterval: ({ state }) => {
      const monitor = state.data ?? initialData.monitor;
      return monitor.isEnabled ? Math.max(15_000, monitor.intervalSeconds * 1000) : false;
    },
  });

  const monitorData = monitorQuery.data ?? initialData.monitor;
  const pollingEnabled = monitorData.isEnabled;
  const { statusMutation } = useMonitorMutations(dashboardId, monitorId);

  const metricsQuery = useQuery({
    queryKey: ['monitor-metrics', dashboardId, monitorId],
    queryFn: () => fetchMonitorMetricsAction(dashboardId, monitorId),
    initialData: initialData.metrics,
    refetchInterval: pollingEnabled ? CRITICAL_POLLING_INTERVAL_MS : false,
    enabled: pollingEnabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const incidentsQuery = useQuery({
    queryKey: ['monitor-incidents', dashboardId, monitorId],
    queryFn: () => fetchMonitorIncidentsAction(dashboardId, monitorId),
    initialData: initialData.incidents,
    refetchInterval: 60_000,
  });

  const checksQuery = useQuery({
    queryKey: ['monitor-checks', dashboardId, monitorId],
    queryFn: async () => (await fetchRecentMonitorResultsAction(dashboardId, monitorId)) ?? [],
    initialData: initialData.recentChecks,
    refetchInterval: pollingEnabled ? CRITICAL_POLLING_INTERVAL_MS : false,
    enabled: pollingEnabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const tlsQuery = useQuery({
    queryKey: ['monitor-tls', dashboardId, monitorId],
    queryFn: () => fetchLatestMonitorTlsResultAction(dashboardId, monitorId),
    initialData: initialData.tls,
    refetchInterval: NON_CRITICAL_POLLING_INTERVAL_MS,
  });

  const operationalState = metricsQuery.data?.operationalState ?? 'preparing';

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <MonitorHeader
        dashboardId={dashboardId}
        hostname={hostname}
        url={monitorData.url}
        operationalState={operationalState}
        actionSlot={
          <div className='flex items-center gap-2 self-start sm:self-auto'>
            <Button
              variant='outline'
              size='sm'
              type='button'
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ monitor: monitorData, isEnabled: !monitorData.isEnabled })}
              className='inline-flex cursor-pointer items-center gap-1.5'
            >
              {statusMutation.isPending ? (
                monitorData.isEnabled ? (
                  tActions('pausing')
                ) : (
                  tActions('resuming')
                )
              ) : (
                <Label className='inline-flex items-center gap-1.5'>
                  {monitorData.isEnabled ? (
                    <PauseCircle className='h-4 w-4' aria-hidden />
                  ) : (
                    <PlayCircle className='h-4 w-4' aria-hidden />
                  )}
                  <Label>{monitorData.isEnabled ? tActions('pause') : tActions('resume')}</Label>
                </Label>
              )}
            </Button>
            <EditMonitorDialog
              dashboardId={dashboardId}
              monitor={monitorData}
              trigger={
                <Button size='sm' variant='outline' className='inline-flex cursor-pointer items-center gap-1.5'>
                  <Pencil className='h-4 w-4' aria-hidden />
                  <Label>{tDetail('actions.edit')}</Label>
                </Button>
              }
            />
          </div>
        }
      />

      <MonitorSummaryTiles
        monitor={{
          isEnabled: monitorData.isEnabled,
          intervalSeconds: monitorData.intervalSeconds,
          timeoutMs: monitorData.timeoutMs,
          createdAt: monitorData.createdAt,
          updatedAt: monitorData.updatedAt,
        }}
        metrics={metricsQuery.data}
        tls={tlsQuery.data}
        operationalState={operationalState}
      />

      <ResponseTimeCard metrics={metricsQuery.data} />

      <div className='grid gap-4 lg:grid-cols-2 xl:grid-cols-3'>
        <IncidentsCard incidents={incidentsQuery.data ?? []} />

        <Uptime180DayCard uptime={initialData.uptime} />
      </div>

      <RecentChecksCard checks={checksQuery.data ?? []} />
    </div>
  );
}

function MonitorHeader({
  dashboardId,
  hostname,
  url,
  operationalState,
  actionSlot,
}: {
  dashboardId: string;
  hostname: string;
  url: string;
  operationalState: MonitorOperationalState;
  actionSlot?: ReactNode;
}) {
  const tHeader = useTranslations('monitoringDetailPage.header');
  const presentation = presentMonitorStatus(operationalState);

  return (
    <div className='space-y-3 px-1 sm:px-0'>
      <Link
        href={`/dashboard/${dashboardId}/monitoring`}
        className='text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs font-medium transition sm:text-sm'
      >
        <ChevronLeft className='h-4 w-4' />
        <Label className='cursor-pointer'>{tHeader('back')}</Label>
      </Link>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <MonitorStatusBadge presentation={presentation} />
            <h1 className='text-xl leading-tight font-semibold sm:text-2xl'>{hostname}</h1>
          </div>
          <div className='text-muted-foreground flex flex-wrap items-center gap-2 pl-1 text-xs sm:text-sm'>
            <Label>{tHeader('monitoring')}</Label>
            <a href={url} target='_blank' rel='noreferrer' className='text-foreground hover:underline' title={url}>
              {url}
            </a>
          </div>
        </div>
        {actionSlot}
      </div>
    </div>
  );
}
