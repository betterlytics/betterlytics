'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  deleteStatusPageAction,
  setStatusPagePublishedAction,
} from '@/app/actions/analytics/statusPage.actions';

export function useSetStatusPagePublishedMutation(dashboardId: string, opts?: { onSuccess?: () => void }) {
  const t = useTranslations('statusPagesPage');
  return useMutation({
    mutationFn: ({ statusPageId, isPublished }: { statusPageId: string; isPublished: boolean }) =>
      setStatusPagePublishedAction(dashboardId, statusPageId, isPublished),
    onSuccess: (_result, { isPublished }) => {
      toast.success(isPublished ? t('actions.publishedToast') : t('actions.unpublishedToast'));
      opts?.onSuccess?.();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });
}

export function useDeleteStatusPageMutation(dashboardId: string, opts?: { onSuccess?: () => void }) {
  const t = useTranslations('statusPagesPage');
  return useMutation({
    mutationFn: (statusPageId: string) => deleteStatusPageAction(dashboardId, statusPageId),
    onSuccess: () => {
      toast.success(t('editor.deleted'));
      opts?.onSuccess?.();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });
}
