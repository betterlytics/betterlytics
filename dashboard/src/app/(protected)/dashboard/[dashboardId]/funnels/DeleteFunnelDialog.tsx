'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { useCallback, useState } from 'react';
import { deleteFunnelAction } from '@/app/actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

type DeleteFunnelDialogProps = {
  funnel: PresentedFunnel;
};

export function DeleteFunnelDialog({ funnel }: DeleteFunnelDialogProps) {
  const t = useTranslations('components.funnels.delete');
  const dashboardId = useDashboardId();
  const [isOpen, setIsOpen] = useState(false);
  const deleteFunnel = useCallback(() => {
    deleteFunnelAction(dashboardId, funnel.id)
      .then(() => {
        setIsOpen(false);
        toast.success(t('successMessage'));
      })
      .catch(() => {
        toast.error(t('errorMessage'));
      });
  }, [dashboardId, funnel.id, t]);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='cursor-pointer'>
          <Trash2 className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex flex-col'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex flex-1 items-end justify-end gap-2'>
          <Button variant='secondary' className='w-30 cursor-pointer' onClick={() => setIsOpen(false)}>
            {t('cancel')}
          </Button>
          <Button variant='destructive' className='w-30 cursor-pointer' onClick={() => deleteFunnel()}>
            {t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
