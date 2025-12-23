'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { type MonitorCheck } from '@/entities/analytics/monitoring.entities';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

type InvalidateOpts = { dashboardId: string; monitorId: string };

function invalidateMonitorQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  { dashboardId, monitorId }: InvalidateOpts,
) {
  queryClient.invalidateQueries({ queryKey: ['monitor', dashboardId, monitorId], exact: false });
  queryClient.invalidateQueries({ queryKey: ['monitor-metrics', dashboardId, monitorId], exact: false });
  queryClient.invalidateQueries({ queryKey: ['monitor-checks', dashboardId, monitorId], exact: false });
  queryClient.invalidateQueries({ queryKey: ['monitor-uptime', dashboardId, monitorId], exact: false });
}

export function useMonitorMutations(dashboardId: string, monitorId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('monitoringDetailPage.toast');

  const statusMutation = useMutation({
    mutationFn: async ({ monitor, isEnabled }: { monitor: MonitorCheck; isEnabled: boolean }) =>
      await updateMonitorCheckAction(dashboardId, {
        id: monitorId,
        name: monitor.name ?? null,
        intervalSeconds: monitor.intervalSeconds,
        timeoutMs: monitor.timeoutMs,
        isEnabled,
        checkSslErrors: monitor.checkSslErrors,
        sslExpiryReminders: monitor.sslExpiryReminders,
        httpMethod: monitor.httpMethod,
        requestHeaders: monitor.requestHeaders ?? null,
        acceptedStatusCodes: monitor.acceptedStatusCodes ?? ['2xx'],
        alertsEnabled: monitor.alertsEnabled,
        alertEmails: monitor.alertEmails ?? [],
        alertOnDown: monitor.alertOnDown,
        alertOnRecovery: monitor.alertOnRecovery,
        alertOnSslExpiry: monitor.alertOnSslExpiry,
        sslExpiryAlertDays: monitor.sslExpiryAlertDays,
        failureThreshold: monitor.failureThreshold,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['monitor', dashboardId, monitorId], updated);
      invalidateMonitorQueries(queryClient, { dashboardId, monitorId });
      toast.success(updated.isEnabled ? t('status.resumed') : t('status.paused'));
    },
    onError: () => {
      toast.error(t('statusError'));
    },
  });

  return {
    statusMutation,
  };
}
