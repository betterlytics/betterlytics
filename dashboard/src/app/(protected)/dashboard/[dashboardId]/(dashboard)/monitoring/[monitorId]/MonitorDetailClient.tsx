'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { PauseCircle, Pencil, PlayCircle } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { Button } from '@/components/ui/button';
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
import { type MonitorCheck } from '@/entities/analytics/monitoring.entities';

type MonitorDetailClientProps = {
  monitorId: string;
  initialMonitor: MonitorCheck;
};

const MIN_POLLING_INTERVAL_MS = 30_000;
const POLLING_BUFFER_MS = 5_000;
const AWAITING_POLL_INTERVAL_MS = 3_000;

export function MonitorDetailClient({ monitorId, initialMonitor }: MonitorDetailClientProps) {
  const tDetail = useTranslations('monitoringDetailPage');
  const tActions = useTranslations('monitoring.actions');
  const {
    input: {
      dashboardId,
      query: { timezone },
    },
  } = useBAQueryParams();

  const { data: monitor } = trpc.monitors.get.useQuery(
    { dashboardId, monitorId },
    { initialData: initialMonitor },
  );

  const [checksErrorsOnly, setChecksErrorsOnly] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [fastPollSinceCheck, setFastPollSinceCheck] = useState<string | null>(null);

  const normalPollInterval: number | false = monitor.isEnabled
    ? Math.max(MIN_POLLING_INTERVAL_MS, monitor.intervalSeconds * 1000 + POLLING_BUFFER_MS)
    : false;

  const activePollInterval: number | false =
    fastPollSinceCheck !== null ? AWAITING_POLL_INTERVAL_MS : normalPollInterval;

  const staleTime = typeof activePollInterval === 'number' ? activePollInterval / 2 : 0;

  const sharedOpts = {
    refetchInterval: activePollInterval,
    staleTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  };

  const [metricsQuery, incidentsQuery, checksQuery, tlsQuery, uptimeQuery] = trpc.useQueries((t) => [
    t.monitors.metrics({ dashboardId, monitorId, timezone }, sharedOpts),
    t.monitors.incidents({ dashboardId, monitorId }, sharedOpts),
    t.monitors.recentResults({ dashboardId, monitorId, errorsOnly: checksErrorsOnly }, sharedOpts),
    t.monitors.latestTls({ dashboardId, monitorId }, sharedOpts),
    t.monitors.uptime({ dashboardId, monitorId, timezone, days: 180 }, sharedOpts),
  ]);

  const metricsLastCheckAt = metricsQuery.data?.lastCheckAt ?? null;

  useEffect(() => {
    if (fastPollSinceCheck !== null && fastPollSinceCheck !== metricsLastCheckAt) {
      setFastPollSinceCheck(null);
    }
  }, [fastPollSinceCheck, metricsLastCheckAt]);

  const metricsLoading = metricsQuery.isPending;
  const operationalState = metricsQuery.data?.operationalState ?? 'preparing';
  const hostname = useMemo(() => safeHostname(monitor.url), [monitor.url]);

  const { statusMutation, renameMutation } = useMonitorMutations(dashboardId, monitorId);

  const handleRename = (name: string | null) => {
    renameMutation.mutate({ monitorId, name });
  };

  const handleEnableSslClick = useCallback(() => {
    setEditSheetOpen(true);
  }, []);

  const handleCountdownExpired = useCallback(() => {
    setFastPollSinceCheck(metricsLastCheckAt);
  }, [metricsLastCheckAt]);

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <MonitorHeader
        statusLoading={metricsLoading}
        monitorName={monitor.name || hostname}
        url={monitor.url}
        operationalState={operationalState}
        onRename={handleRename}
        isRenaming={renameMutation.isPending}
        actionSlot={
          <>
            {/* Mobile */}
            <div className='sm:hidden'>
              <MonitorActionMenu monitor={monitor} dashboardId={dashboardId} vertical />
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
                    onClick={() => statusMutation.mutate({ monitorId, isEnabled: !monitor.isEnabled })}
                    className='inline-flex cursor-pointer items-center gap-1.5'
                  >
                    {statusMutation.isPending ? (
                      monitor.isEnabled ? (
                        tActions('pausing')
                      ) : (
                        tActions('resuming')
                      )
                    ) : (
                      <span className='inline-flex items-center gap-1.5'>
                        {monitor.isEnabled ? (
                          <PauseCircle className='h-4 w-4' aria-hidden />
                        ) : (
                          <PlayCircle className='h-4 w-4' aria-hidden />
                        )}
                        <span>{monitor.isEnabled ? tActions('pause') : tActions('resume')}</span>
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
                    monitor={monitor}
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
        loading={metricsLoading}
        monitor={monitor}
        metrics={metricsQuery.data}
        tls={tlsQuery.data}
        operationalState={operationalState}
        onEnableSslClick={handleEnableSslClick}
        onCountdownExpired={handleCountdownExpired}
      />

      <ResponseTimeCard loading={metricsLoading} metrics={metricsQuery.data} />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3'>
        <IncidentsCard loading={incidentsQuery.isPending} incidents={incidentsQuery.data ?? []} />
        <Uptime180DayCard loading={uptimeQuery.isPending} uptime={uptimeQuery.data} />
      </div>

      <RecentChecksCard
        loading={checksQuery.isPending}
        checks={checksQuery.data ?? []}
        errorsOnly={checksErrorsOnly}
        setErrorsOnly={setChecksErrorsOnly}
      />
    </div>
  );
}
