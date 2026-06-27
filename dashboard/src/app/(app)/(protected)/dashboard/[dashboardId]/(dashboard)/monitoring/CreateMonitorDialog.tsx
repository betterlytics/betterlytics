'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { MonitorFormDialog } from './MonitorFormDialog';

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

  if (atLimit) {
    return <UpgradeButton>{t('upgradeToCreate')}</UpgradeButton>;
  }

  return (
    <MonitorFormDialog
      open={open}
      onOpenChange={setOpen}
      dashboardId={dashboardId}
      domain={domain}
      existingUrls={existingUrls}
      onCreated={() => router.refresh()}
      trigger={
        <Button variant='default' className='cursor-pointer whitespace-nowrap' disabled={disabled}>
          {t('create')}
          <span className='ml-1.5 text-xs opacity-70'>
            ({monitorCount}/{maxMonitors})
          </span>
        </Button>
      }
    />
  );
}
