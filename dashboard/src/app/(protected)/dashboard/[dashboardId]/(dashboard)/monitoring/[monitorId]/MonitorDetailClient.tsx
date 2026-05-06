'use client';

import { useState, useCallback } from 'react';
import { PauseCircle, Pencil, PlayCircle } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
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
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { NotificationHistoryDialog } from '@/components/dialogs/NotificationHistoryDialog';

type MonitorDetailClientProps = {
  dashboardId: string;
  monitorId: string;
  hostname: string;
  timezone: string;
  serverNow: number;
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
  serverNow,
  initialData,
}: MonitorDetailClientProps) {
  const tDetail = useTranslations('monitoringDetailPage');
  const tActions = useTranslations('monitoring.actions');
  const monitorQuery = trpc.monitors.get.useQuery(
    { dashboardId, monitorId },
    {
      initialData: initialData.monitor,
      refetchInterval: ({ state }) => {
        const monitor = state.data ?? initialData.monitor;
        return monitor.isEnabled ? Math.max(MIN_POLLING_INTERVAL_MS, monitor.intervalSeconds * 1000) : false;
      },
    },
  );

  const monitorData = monitorQuery.data ?? initialData.monitor;
  const pollingEnabled = monitorData.isEnabled;

  const dynamicPollingInterval = Math.max(
    MIN_POLLING_INTERVAL_MS,
    monitorData.intervalSeconds * 1000 + POLLING_BUFFER_MS,
  );

  const DEFAULT_QUERY_PARAMS = {
    refetchInterval: dynamicPollingInterval,
    staleTime: dynamicPollingInterval / 2,
    enabled: pollingEnabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  };

  const metricsQuery = trpc.monitors.metrics.useQuery(
    { dashboardId, monitorId, timezone },
    {
      initialData: initialData.metrics,
      ...DEFAULT_QUERY_PARAMS,
    },
  );

  const incidentsQuery = trpc.monitors.incidents.useQuery(
    { dashboardId, monitorId },
    {
      initialData: initialData.incidents,
      ...DEFAULT_QUERY_PARAMS,
    },
  );

  const [checksErrorsOnly, setChecksErrorsOnly] = useState(false);
  const checksQuery = trpc.monitors.recentResults.useQuery(
    { dashboardId, monitorId, errorsOnly: checksErrorsOnly },
    {
      placeholderData: initialData.recentChecks,
      ...DEFAULT_QUERY_PARAMS,
    },
  );

  const tlsQuery = trpc.monitors.latestTls.useQuery(
    { dashboardId, monitorId },
    {
      initialData: initialData.tls,
      ...DEFAULT_QUERY_PARAMS,
      refetchInterval: NON_CRITICAL_POLLING_INTERVAL_MS,
      staleTime: NON_CRITICAL_POLLING_INTERVAL_MS / 2,
    },
  );

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
              <PermissionGate>
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
              </PermissionGate>
              <NotificationHistoryDialog monitorId={monitorId} />
              <PermissionGate>
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
              </PermissionGate>
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
        serverNow={serverNow}
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
