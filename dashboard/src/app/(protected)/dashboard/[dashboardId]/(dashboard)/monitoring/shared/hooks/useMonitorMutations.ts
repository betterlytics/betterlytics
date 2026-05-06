'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { updateMonitorCheckAction, deleteMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function useMonitorMutations(dashboardId: string, monitorId: string) {
  const utils = trpc.useUtils();
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
      utils.monitors.get.setData({ dashboardId, monitorId }, updated);
      utils.monitors.invalidate();
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
      utils.monitors.get.setData({ dashboardId, monitorId }, updated);
      utils.monitors.invalidate();
      toast.success(tActions('renameSuccess'));
    },
    onError: () => {
      toast.error(tActions('renameError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => await deleteMonitorCheckAction(dashboardId, monitorId),
    onSuccess: () => {
      utils.monitors.invalidate();
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
