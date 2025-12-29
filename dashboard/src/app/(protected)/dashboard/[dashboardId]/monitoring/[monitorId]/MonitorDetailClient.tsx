'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PauseCircle, Pencil, PlayCircle } from 'lucide-react';
import {
  fetchLatestMonitorTlsResultAction,
  fetchMonitorCheckAction,
  fetchMonitorIncidentsAction,
  fetchMonitorMetricsAction,
  fetchRecentMonitorResultsAction,
} from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import { DisabledDemoTooltip } from '@/components/tooltip/DisabledDemoTooltip';
import {
  type MonitorCheck,
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorResult,
  type MonitorTlsResult,
} from '@/entities/analytics/monitoring.entities';
import { type PresentedMonitorUptime } from '@/presenters/toMonitorUptimeDays';
import { useMonitorMutations } from '../shared/hooks/useMonitorMutations';
import { EditMonitorSheet } from './EditMonitorSheet';
import { IncidentsCard, RecentChecksCard, ResponseTimeCard, Uptime180DayCard } from './MonitoringSections';
import { MonitorSummarySection } from './MonitorSummarySection';
import { MonitorHeader } from './MonitorHeader';
import { useTranslations } from 'next-intl';
import { MonitorActionMenu } from '../components';

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
        monitorName={monitorData.name || hostname}
        url={monitorData.url}
        operationalState={operationalState}
        onRename={handleRename}
        isRenaming={renameMutation.isPending}
        actionSlot={
          <>
            {/* Mobile */}
            <div className='sm:hidden'>
              <MonitorActionMenu monitor={monitorData} dashboardId={dashboardId} vertical />
            </div>

            {/* Desktop */}
            <div className='hidden items-center gap-2 sm:flex'>
              <DisabledDemoTooltip>
                {(disabled) => (
                  <Button
                    variant='outline'
                    size='sm'
                    type='button'
                    disabled={disabled || statusMutation.isPending}
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
                )}
              </DisabledDemoTooltip>
              <DisabledDemoTooltip>
                {(disabled) => (
                  <EditMonitorSheet
                    dashboardId={dashboardId}
                    monitor={monitorData}
                    open={editSheetOpen}
                    onOpenChange={setEditSheetOpen}
                    trigger={
                      <Button
                        size='sm'
                        variant='outline'
                        className='inline-flex cursor-pointer items-center gap-1.5'
                        disabled={disabled}
                      >
                        <Pencil className='h-4 w-4' aria-hidden />
                        <span>{tDetail('actions.edit')}</span>
                      </Button>
                    }
                  />
                )}
              </DisabledDemoTooltip>
            </div>
          </>
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
