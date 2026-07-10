'use client';

import { useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useOverlayReset } from '@/hooks/use-overlay-reset';
import { type MonitorCheck } from '@/entities/analytics/monitoring.entities';
import { CreateMonitorForm } from './CreateMonitorForm';
import { useCreateMonitor } from './shared/hooks/useCreateMonitor';

type CreateMonitorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: string;
  domain: string;
  existingUrls: string[];
  /** Fired after a successful create; the dialog has already closed and reset itself. */
  onCreated: (monitor: MonitorCheck) => void;
  trigger?: ReactNode;
};

export function CreateMonitorDialog({
  open,
  onOpenChange,
  dashboardId,
  domain,
  existingUrls,
  onCreated,
  trigger,
}: CreateMonitorDialogProps) {
  const t = useTranslations('monitoringPage.form');
  const markPendingRef = useRef<() => void>(() => {});

  const create = useCreateMonitor({
    dashboardId,
    domain,
    existingUrls,
    onCreated: (monitor) => {
      markPendingRef.current();
      onOpenChange(false);
      onCreated(monitor);
    },
  });

  const { markPending, onAnimationEnd } = useOverlayReset(create.reset);
  markPendingRef.current = markPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl' onAnimationEnd={onAnimationEnd}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <CreateMonitorForm
          create={create}
          domain={domain}
          onCancel={() => {
            markPending();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
