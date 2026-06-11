'use client';

import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { postFunnelAction } from '@/app/actions/index.actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useOverlayReset } from '@/hooks/use-overlay-reset';
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { CreateFunnelSchema } from '@/entities/analytics/funnels.entities';
import { createEmptyQueryFilter } from '@/entities/analytics/filter.entities';
import { generateTempId } from '@/utils/temporaryId';
import { FunnelDialogContent } from './FunnelDialogContent';
import { FunnelDialogLayout } from './FunnelDialogLayout';

type CreateFunnelDialogProps = {
  triggerText?: string;
  triggerVariant?: ComponentProps<typeof Button>['variant'];
  disabled?: boolean;
};

const createDefaultSteps = () => [
  { id: generateTempId(), name: '', filters: [createEmptyQueryFilter()] },
  { id: generateTempId(), name: '', filters: [createEmptyQueryFilter()] },
];

export function CreateFunnelDialog({ triggerText, triggerVariant, disabled }: CreateFunnelDialogProps) {
  const t = useTranslations('components.funnels');
  const [isOpen, setIsOpen] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const dashboardId = useDashboardId();
  const utils = trpc.useUtils();
  const dialog = useFunnelDialog({
    dashboardId,
    initialName: '',
    initialSteps: createDefaultSteps(),
  });
  const { metadata, funnelSteps, reset } = dialog;

  const isCreateValid = useMemo(
    () =>
      CreateFunnelSchema.safeParse({
        name: metadata.name,
        dashboardId,
        isStrict: metadata.isStrict,
        funnelSteps,
      }).success,
    [dashboardId, funnelSteps, metadata.isStrict, metadata.name],
  );

  const { markPending, onAnimationEnd } = useOverlayReset(() => {
    setHasAttemptedSubmit(false);
    reset({ name: '', isStrict: false, steps: createDefaultSteps() });
  });

  const handleCreateFunnel = useCallback(() => {
    setHasAttemptedSubmit(true);
    if (!isCreateValid) {
      return;
    }
    postFunnelAction(dashboardId, metadata.name, funnelSteps, metadata.isStrict)
      .then(() => {
        markPending();
        setIsOpen(false);
        toast.success(t('create.successMessage'));
        utils.funnels.list.invalidate({ dashboardId });
      })
      .catch(() => {
        toast.error(t('create.errorMessage'));
      });
  }, [dashboardId, funnelSteps, isCreateValid, markPending, metadata.isStrict, metadata.name, t, utils]);

  const handleCancel = useCallback(() => {
    markPending();
    setIsOpen(false);
  }, [markPending]);

  return (
    <FunnelDialogLayout
      open={isOpen}
      onOpenChange={setIsOpen}
      onAnimationEnd={onAnimationEnd}
      title={t('create.createFunnel')}
      trigger={
        <Button variant={triggerVariant || 'ghost'} className='cursor-pointer' disabled={disabled}>
          <PlusIcon className='h-4 w-4' />
          {triggerText}
        </Button>
      }
      footer={
        <>
          <Button variant='outline' className='w-30 cursor-pointer' onClick={handleCancel}>
            {t('create.cancel')}
          </Button>
          <Button variant='default' className='w-30 cursor-pointer' onClick={handleCreateFunnel}>
            {t('create.create')}
          </Button>
        </>
      }
    >
      <FunnelDialogContent
        dialog={dialog}
        hasAttemptedSubmit={hasAttemptedSubmit}
        initialOpenId={funnelSteps[0]?.id}
        labels={{
          name: t('create.name'),
          namePlaceholder: t('create.namePlaceholder'),
          strictMode: t('create.strictMode'),
          addStep: t('create.addStep'),
        }}
      />
    </FunnelDialogLayout>
  );
}
