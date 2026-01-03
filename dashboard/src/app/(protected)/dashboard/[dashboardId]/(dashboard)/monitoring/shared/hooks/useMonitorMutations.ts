'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { updateMonitorCheckAction, deleteMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
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
  queryClient.invalidateQueries({ queryKey: ['monitors', dashboardId], exact: false });
}

export function useMonitorMutations(dashboardId: string, monitorId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations('monitoringDetailPage.toast');
  const tActions = useTranslations('monitoringPage.actions');

  const statusMutation = useMutation({
    mutationFn: async ({ monitorId, isEnabled }: { monitorId: string; isEnabled: boolean }) =>
      await updateMonitorCheckAction(dashboardId, {
        id: monitorId,
        isEnabled,
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

  const renameMutation = useMutation({
    mutationFn: async ({ monitorId, name }: { monitorId: string; name: string | null }) =>
      await updateMonitorCheckAction(dashboardId, {
        id: monitorId,
        name,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['monitor', dashboardId, monitorId], updated);
      invalidateMonitorQueries(queryClient, { dashboardId, monitorId });
      toast.success(tActions('renameSuccess'));
    },
    onError: () => {
      toast.error(tActions('renameError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => await deleteMonitorCheckAction(dashboardId, monitorId),
    onSuccess: () => {
      invalidateMonitorQueries(queryClient, { dashboardId, monitorId });
      router.push(`/dashboard/${dashboardId}/monitoring`);
      router.refresh();
    },
    onError: () => {
      toast.error(tActions('deleteError'));
    },
  });

  return {
    statusMutation,
    renameMutation,
    deleteMutation,
  };
}
