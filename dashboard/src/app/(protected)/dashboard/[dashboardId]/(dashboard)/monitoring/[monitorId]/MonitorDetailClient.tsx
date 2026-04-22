'use client';

import { useState, useCallback, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { PauseCircle, Pencil, PlayCircle } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useQueryState } from '@/hooks/use-query-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMonitorMutations } from '../shared/hooks/useMonitorMutations';
import { EditMonitorSheet } from './EditMonitorSheet';
import { IncidentsCard, RecentChecksCard, ResponseTimeCard, Uptime180DayCard } from './MonitoringSections';
import { MonitorSummarySection } from './MonitorSummarySection';
import { MonitorHeader } from './MonitorHeader';
import { useTranslations } from 'next-intl';
import { MonitorActionMenu } from '../components';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { NotificationHistoryDialog } from '@/components/dialogs/NotificationHistoryDialog';
import { safeHostname } from '../utils';

type MonitorDetailClientProps = {
  monitorId: string;
};

const NON_CRITICAL_POLLING_INTERVAL_MS = 10 * 60_000;

const MIN_POLLING_INTERVAL_MS = 30_000;
const POLLING_BUFFER_MS = 5_000;

export function MonitorDetailClient({ monitorId }: MonitorDetailClientProps) {
  const tDetail = useTranslations('monitoringDetailPage');
  const tActions = useTranslations('monitoring.actions');
  const {
    input: {
      dashboardId,
      query: { timezone },
    },
  } = useBAQueryParams();

  const monitorQuery = trpc.monitors.get.useQuery(
    { dashboardId, monitorId },
    {
      refetchInterval: ({ state }) => {
        const monitor = state.data;
        if (!monitor) return false;
        return monitor.isEnabled ? Math.max(MIN_POLLING_INTERVAL_MS, monitor.intervalSeconds * 1000) : false;
      },
    },
  );

  const { data: monitorData, loading: monitorLoading } = useQueryState(monitorQuery);

  const pollingEnabled = monitorData?.isEnabled ?? false;
  const subQueriesEnabled = !monitorLoading && monitorData != null;

  const dynamicPollingInterval = Math.max(
    MIN_POLLING_INTERVAL_MS,
    (monitorData?.intervalSeconds ?? MIN_POLLING_INTERVAL_MS / 1000) * 1000 + POLLING_BUFFER_MS,
  );

  const DEFAULT_QUERY_PARAMS = {
    refetchInterval: pollingEnabled ? dynamicPollingInterval : (false as const),
    staleTime: dynamicPollingInterval / 2,
    enabled: subQueriesEnabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  };

  const metricsQuery = trpc.monitors.metrics.useQuery(
    { dashboardId, monitorId, timezone },
    DEFAULT_QUERY_PARAMS,
  );
  const { loading: metricsLoading } = useQueryState(metricsQuery, subQueriesEnabled);

  const loading = monitorLoading || metricsLoading;

  const incidentsQuery = trpc.monitors.incidents.useQuery({ dashboardId, monitorId }, DEFAULT_QUERY_PARAMS);

  const [checksErrorsOnly, setChecksErrorsOnly] = useState(false);
  const checksQuery = trpc.monitors.recentResults.useQuery(
    { dashboardId, monitorId, errorsOnly: checksErrorsOnly },
    DEFAULT_QUERY_PARAMS,
  );

  const tlsQuery = trpc.monitors.latestTls.useQuery(
    { dashboardId, monitorId },
    {
      ...DEFAULT_QUERY_PARAMS,
      refetchInterval: NON_CRITICAL_POLLING_INTERVAL_MS,
      staleTime: NON_CRITICAL_POLLING_INTERVAL_MS / 2,
    },
  );

  const uptimeQuery = trpc.monitors.uptime.useQuery(
    { dashboardId, monitorId, timezone, days: 180 },
    {
      ...DEFAULT_QUERY_PARAMS,
      refetchInterval: NON_CRITICAL_POLLING_INTERVAL_MS,
      staleTime: NON_CRITICAL_POLLING_INTERVAL_MS / 2,
    },
  );

  const operationalState = metricsQuery.data?.operationalState ?? 'preparing';

  const hostname = useMemo(() => (monitorData ? safeHostname(monitorData.url) : ''), [monitorData]);

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

  if (!monitorLoading && !monitorData) {
    notFound();
  }

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <MonitorHeader
        loading={loading}
        monitorName={monitorData?.name || hostname}
        url={monitorData?.url ?? ''}
        operationalState={operationalState}
        onRename={handleRename}
        isRenaming={renameMutation.isPending}
        actionSlot={
          loading ? (
            <>
              {/* Mobile */}
              <div className='sm:hidden'>
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
              {/* Desktop */}
              <div className='hidden items-center gap-2 sm:flex'>
                <Skeleton className='h-8 w-24 rounded-md' />
                <Skeleton className='h-8 w-24 rounded-md' />
                <Skeleton className='h-8 w-20 rounded-md' />
              </div>
            </>
          ) : monitorData ? (
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
          ) : undefined
        }
      />

      <MonitorSummarySection
        loading={loading}
        monitor={monitorData ?? undefined}
        metrics={metricsQuery.data}
        tls={tlsQuery.data}
        operationalState={operationalState}
        onEnableSslClick={handleEnableSslClick}
        onCountdownExpired={handleCountdownExpired}
      />

      <ResponseTimeCard loading={loading} metrics={metricsQuery.data} />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3'>
        <IncidentsCard loading={loading} incidents={incidentsQuery.data ?? []} />

        <Uptime180DayCard loading={loading} uptime={uptimeQuery.data} />
      </div>

      <RecentChecksCard
        loading={loading}
        checks={checksQuery.data ?? []}
        errorsOnly={checksErrorsOnly}
        setErrorsOnly={setChecksErrorsOnly}
      />
    </div>
  );
}
