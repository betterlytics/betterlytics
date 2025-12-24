'use client';

import { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { deleteFunnelAction } from '@/app/actions/index.actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

type DeleteFunnelDialogProps = {
  funnel: PresentedFunnel;
  disabled?: boolean;
};

export function DeleteFunnelDialog({ funnel, disabled }: DeleteFunnelDialogProps) {
  const t = useTranslations('components.funnels.delete');
  const dashboardId = useDashboardId();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = useCallback(() => {
    setIsPending(true);
    deleteFunnelAction(dashboardId, funnel.id)
      .then(() => {
        setIsOpen(false);
        toast.success(t('successMessage'));
      })
      .catch(() => {
        toast.error(t('errorMessage'));
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [dashboardId, funnel.id, t]);

  return (
    <>
      <Button variant='ghost' className='cursor-pointer' disabled={disabled} onClick={() => setIsOpen(true)}>
        <Trash2 className='h-4 w-4' />
      </Button>

      <DestructiveActionDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t('title')}
        description={t('description')}
        cancelLabel={t('cancel')}
        confirmLabel={t('delete')}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </>
  );
}
