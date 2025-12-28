'use client';

import Link from 'next/link';
import { useState, useCallback, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, PauseCircle, Pencil, PlayCircle } from 'lucide-react';
import { presentMonitorStatus } from '@/app/(protected)/dashboard/[dashboardId]/monitoring/styles';
import {
  fetchLatestMonitorTlsResultAction,
  fetchMonitorCheckAction,
  fetchMonitorIncidentsAction,
  fetchMonitorMetricsAction,
  fetchRecentMonitorResultsAction,
} from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import { EditableLabel } from '@/components/inputs/EditableLabel';
import {
  MONITOR_LIMITS,
  type MonitorCheck,
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorOperationalState,
  type MonitorResult,
  type MonitorTlsResult,
} from '@/entities/analytics/monitoring.entities';
import { type PresentedMonitorUptime } from '@/presenters/toMonitorUptimeDays';
import { useMonitorMutations } from './(EditMonitorSheet)/hooks/useMonitorMutations';
import { EditMonitorSheet } from './(EditMonitorSheet)/EditMonitorSheet';
import { IncidentsCard, RecentChecksCard, ResponseTimeCard, Uptime180DayCard } from './MonitoringSections';
import { MonitorSummarySection } from './MonitorSummarySection';
import { useTranslations } from 'next-intl';
import { MonitorStatusBadge } from '../components/MonitorStatusBadge';

type MonitorDetailClientProps = {
  dashboardId: string;
  monitorId: string;
  hostname: string;
  timezone: string;
  initialData: {
    monitor: MonitorCheck;
    metrics?: MonitorMetrics;
    incidents: MonitorIncidentSegment[];
    recentChecks: MonitorResult[];
    tls: MonitorTlsResult | null;
    uptime: PresentedMonitorUptime;
  };
};

const NON_CRITICAL_POLLING_INTERVAL_MS = 10 * 60_000;

const MIN_POLLING_INTERVAL_MS = 30_000;
const POLLING_BUFFER_MS = 5_000;

export function MonitorDetailClient({
  dashboardId,
  monitorId,
  hostname,
  timezone,
  initialData,
}: MonitorDetailClientProps) {
  const tDetail = useTranslations('monitoringDetailPage');
  const tActions = useTranslations('monitoring.actions');
  const monitorQuery = useQuery({
    queryKey: ['monitor', dashboardId, monitorId],
    queryFn: () => fetchMonitorCheckAction(dashboardId, monitorId),
    initialData: initialData.monitor,
    refetchInterval: ({ state }) => {
      const monitor = state.data ?? initialData.monitor;
      return monitor.isEnabled ? Math.max(MIN_POLLING_INTERVAL_MS, monitor.intervalSeconds * 1000) : false;
    },
  });

  const monitorData = monitorQuery.data ?? initialData.monitor;
  const pollingEnabled = monitorData.isEnabled;

  const dynamicPollingInterval = Math.max(
    MIN_POLLING_INTERVAL_MS,
    monitorData.intervalSeconds * 1000 + POLLING_BUFFER_MS,
  );

  const metricsQuery = useQuery({
    queryKey: ['monitor-metrics', dashboardId, monitorId],
    queryFn: () => fetchMonitorMetricsAction(dashboardId, monitorId, timezone),
    initialData: initialData.metrics,
    refetchInterval: dynamicPollingInterval,
    enabled: pollingEnabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const incidentsQuery = useQuery({
    queryKey: ['monitor-incidents', dashboardId, monitorId],
    queryFn: () => fetchMonitorIncidentsAction(dashboardId, monitorId),
    initialData: initialData.incidents,
    refetchInterval: dynamicPollingInterval,
    enabled: pollingEnabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const [checksErrorsOnly, setChecksErrorsOnly] = useState(false);
  const checksQuery = useQuery({
    queryKey: ['monitor-checks', dashboardId, monitorId, checksErrorsOnly],
    queryFn: async () => (await fetchRecentMonitorResultsAction(dashboardId, monitorId, checksErrorsOnly)) ?? [],
    initialData: initialData.recentChecks,
    refetchInterval: dynamicPollingInterval,
    enabled: pollingEnabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const tlsQuery = useQuery({
    queryKey: ['monitor-tls', dashboardId, monitorId],
    queryFn: () => fetchLatestMonitorTlsResultAction(dashboardId, monitorId),
    initialData: initialData.tls,
    refetchInterval: NON_CRITICAL_POLLING_INTERVAL_MS,
    enabled: pollingEnabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const operationalState = metricsQuery.data?.operationalState ?? 'preparing';

  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const { statusMutation, renameMutation } = useMonitorMutations(dashboardId, monitorId);

  const handleRename = (name: string | null) => {
    renameMutation.mutate({ monitorId, name });
  };

  const handleEnableSslClick = useCallback(() => {
    setEditSheetOpen(true);
  }, []);

  const handleCountdownExpired = useCallback(() => {
    metricsQuery.refetch();
    incidentsQuery.refetch();
    checksQuery.refetch();
  }, [metricsQuery, incidentsQuery, checksQuery]);

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <MonitorHeader
        dashboardId={dashboardId}
        monitorName={monitorData.name || hostname}
        url={monitorData.url}
        operationalState={operationalState}
        onRename={handleRename}
        isRenaming={renameMutation.isPending}
        actionSlot={
          <div className='flex items-center gap-2 self-start sm:self-auto'>
            <Button
              variant='outline'
              size='sm'
              type='button'
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ monitorId, isEnabled: !monitorData.isEnabled })}
              className='inline-flex cursor-pointer items-center gap-1.5'
            >
              {statusMutation.isPending ? (
                monitorData.isEnabled ? (
                  tActions('pausing')
                ) : (
                  tActions('resuming')
                )
              ) : (
                <span className='inline-flex items-center gap-1.5'>
                  {monitorData.isEnabled ? (
                    <PauseCircle className='h-4 w-4' aria-hidden />
                  ) : (
                    <PlayCircle className='h-4 w-4' aria-hidden />
                  )}
                  <span>{monitorData.isEnabled ? tActions('pause') : tActions('resume')}</span>
                </span>
              )}
            </Button>
            <EditMonitorSheet
              dashboardId={dashboardId}
              monitor={monitorData}
              open={editSheetOpen}
              onOpenChange={setEditSheetOpen}
              trigger={
                <Button size='sm' variant='outline' className='inline-flex cursor-pointer items-center gap-1.5'>
                  <Pencil className='h-4 w-4' aria-hidden />
                  <span>{tDetail('actions.edit')}</span>
                </Button>
              }
            />
          </div>
        }
      />

      <MonitorSummarySection
        monitor={monitorData}
        metrics={metricsQuery.data}
        tls={tlsQuery.data}
        operationalState={operationalState}
        onEnableSslClick={handleEnableSslClick}
        onCountdownExpired={handleCountdownExpired}
      />

      <ResponseTimeCard metrics={metricsQuery.data} />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3'>
        <IncidentsCard incidents={incidentsQuery.data ?? []} />

        <Uptime180DayCard uptime={initialData.uptime} />
      </div>

      <RecentChecksCard
        checks={checksQuery.data ?? []}
        errorsOnly={checksErrorsOnly}
        setErrorsOnly={setChecksErrorsOnly}
      />
    </div>
  );
}

function MonitorHeader({
  dashboardId,
  monitorName,
  url,
  operationalState,
  actionSlot,
  onRename,
  isRenaming,
}: {
  dashboardId: string;
  monitorName: string;
  url: string;
  operationalState: MonitorOperationalState;
  actionSlot?: ReactNode;
  onRename?: (name: string | null) => void;
  isRenaming?: boolean;
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
        <span className='cursor-pointer'>{tHeader('back')}</span>
      </Link>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <MonitorStatusBadge presentation={presentation} />
            <EditableLabel
              value={monitorName}
              onSubmit={onRename}
              disabled={isRenaming}
              placeholder='Monitor name'
              maxLength={MONITOR_LIMITS.NAME_MAX}
              textClassName='text-xl font-semibold leading-tight sm:text-2xl'
              inputClassName='min-w-[150px]'
            />
          </div>
          <div className='text-muted-foreground flex flex-wrap items-center gap-2 pl-1 text-xs sm:text-sm'>
            <span>{tHeader('monitoring')}</span>
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
