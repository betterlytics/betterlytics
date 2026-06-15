'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useOverlayReset } from '@/hooks/use-overlay-reset';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { CreateMonitorForm } from './CreateMonitorForm';
import { useCreateMonitor } from './shared/hooks/useCreateMonitor';

type CreateMonitorDialogProps = {
  dashboardId: string;
  domain: string;
  existingUrls: string[];
  disabled?: boolean;
  monitorCount: number;
  maxMonitors: number;
  atLimit: boolean;
};

export function CreateMonitorDialog({
  dashboardId,
  domain,
  existingUrls,
  disabled,
  monitorCount,
  maxMonitors,
  atLimit,
}: CreateMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('monitoringPage.form');

  const markPendingRef = useRef<() => void>(() => {});

  const create = useCreateMonitor({
    dashboardId,
    domain,
    existingUrls,
    onCreated: () => {
      markPendingRef.current();
      setOpen(false);
      router.refresh();
    },
  });

  const { markPending, onAnimationEnd } = useOverlayReset(create.reset);
  markPendingRef.current = markPending;

  if (atLimit) {
    return <UpgradeButton>{t('upgradeToCreate')}</UpgradeButton>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default' className='cursor-pointer whitespace-nowrap' disabled={disabled}>
          {t('create')}
          <span className='ml-1.5 text-xs opacity-70'>
            ({monitorCount}/{maxMonitors})
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl' onAnimationEnd={onAnimationEnd}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <CreateMonitorForm
          create={create}
          domain={domain}
          onCancel={() => {
            markPending();
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
