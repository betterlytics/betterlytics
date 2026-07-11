'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { type StatusPageWithMonitors } from '@/entities/analytics/statusPage/statusPage.entities';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import { collectStagedImages } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/collectStagedImages';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import {
  useDeleteStatusPageMutation,
  useSetStatusPagePublishedMutation,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageMutations';
import { updateStatusPageAction } from '@/app/actions/analytics/statusPage.actions';

type UseStatusPageEditorArgs = {
  dashboardId: string;
  statusPage: StatusPageWithMonitors;
  form: StatusPageFormState;
  markSaved: () => void;
  closeStudio: () => void;
};

export function useStatusPageEditor({
  dashboardId,
  statusPage,
  form,
  markSaved,
  closeStudio,
}: UseStatusPageEditorArgs) {
  const t = useTranslations('statusPagesPage.editor');
  const router = useRouter();
  const { resolveHref } = useDashboardNavigation();

  const payload = useMemo(() => ({ id: statusPage.id, ...form.input }), [statusPage.id, form.input]);

  const savedSnapshotRef = useRef(form.snapshot);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const images = await collectStagedImages(form);
      return updateStatusPageAction(dashboardId, payload, images);
    },
    onSuccess: (page) => {
      if (page) {
        form.logo.commit(page.logoUrl);
        form.favicon.commit(page.faviconUrl);
      }
      markSaved();
      savedSnapshotRef.current = form.snapshot;
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const publishMutation = useSetStatusPagePublishedMutation(dashboardId, { onSuccess: () => router.refresh() });

  const deleteMutation = useDeleteStatusPageMutation(dashboardId, {
    onSuccess: () => router.push(resolveHref('status-pages')),
  });

  const handleDiscard = useCallback(() => form.reset(savedSnapshotRef.current), [form]);

  const saveNow = () => saveMutation.mutate(undefined, { onSuccess: () => toast.success(t('saved')) });
  const studioSaveNow = () =>
    saveMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('saved'));
        closeStudio();
      },
    });

  // Both save entry points share the publish-confirm gate; the ref remembers which one to run.
  const pendingSaveRef = useRef<() => void>(saveNow);
  const requestSave = (run: () => void) => {
    if (statusPage.isPublished) {
      pendingSaveRef.current = run;
      setShowPublishConfirm(true);
    } else {
      run();
    }
  };

  return {
    saveMutation,
    publishMutation,
    deleteMutation,
    handleDiscard,
    handleSave: () => requestSave(saveNow),
    handleStudioSave: () => requestSave(studioSaveNow),
    showPublishConfirm,
    setShowPublishConfirm,
    confirmPendingSave: () => {
      setShowPublishConfirm(false);
      pendingSaveRef.current();
    },
  };
}
