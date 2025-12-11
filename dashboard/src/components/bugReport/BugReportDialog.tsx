'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { submitBugReportAction } from '@/app/actions/system/bugReports.action';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { BUG_REPORT_MAX_LENGTH } from '@/entities/system/bugReport.entities';

type BugReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BugReportDialog({ open, onOpenChange }: BugReportDialogProps) {
  const t = useTranslations('components.bugReport');
  const dashboardId = useDashboardId();

  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error(t('toast.empty'));
      return;
    }

    startTransition(async () => {
      try {
        await submitBugReportAction(dashboardId, { message: trimmed });
        toast.success(t('toast.success'));
        setMessage('');
        onOpenChange(false);
      } catch (error) {
        console.error(error);
        toast.error(t('toast.error'));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t('placeholder')}
            rows={6}
            disabled={isPending}
            className='placeholder-muted-foreground/75 max-h-[50vh] min-h-64 overflow-y-auto sm:max-h-[80vh]'
            maxLength={BUG_REPORT_MAX_LENGTH}
          />
          <div className='text-muted-foreground flex justify-end text-xs'>
            {message.length}/{BUG_REPORT_MAX_LENGTH}
          </div>
          <DialogFooter>
            <Button type='submit' disabled={isPending || message.length === 0} className='cursor-pointer'>
              {isPending ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
