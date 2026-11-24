'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { DestructiveActionDialog } from '@/components/dialogs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { updateDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';

interface AiAccessSettingProps {
  dashboardId: string;
  initialEnabled: boolean;
  // what loses access when it is turned off; only owners and admins, who can turn it off, get them
  access: { connections: number; tokens: number } | null;
}

/** Turning it on saves at once; turning it off asks first, with what loses access. */
export function AiAccessSetting({ dashboardId, initialEnabled, access }: AiAccessSettingProps) {
  const t = useTranslations('mcp.aiAccess');
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = (value: boolean) => {
    setEnabled(value);
    startTransition(async () => {
      try {
        await updateDashboardSettingsAction(dashboardId, { aiAccessEnabled: value });
        setIsConfirmOpen(false);
        toast.success(value ? t('toast.on') : t('toast.off'));
      } catch {
        setEnabled(!value);
        toast.error(t('toast.error'));
      }
    });
  };

  return (
    <>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <span className='text-sm font-medium'>{t('label')}</span>
          <p className='text-muted-foreground text-xs'>{enabled ? t('on') : t('off')}</p>
        </div>
        <PermissionGate permission='canManageSettings'>
          {(disabled) => (
            <Switch
              id='ai-access'
              className='cursor-pointer'
              aria-label={t('label')}
              checked={enabled}
              disabled={isPending || disabled}
              onCheckedChange={(value) => (value ? save(true) : setIsConfirmOpen(true))}
            />
          )}
        </PermissionGate>
      </div>

      <DestructiveActionDialog
        open={isConfirmOpen}
        onOpenChange={(open) => !isPending && setIsConfirmOpen(open)}
        title={t('turnOffDialog.title')}
        description={t('turnOffDialog.description', {
          connections: access?.connections ?? 0,
          tokens: access?.tokens ?? 0,
        })}
        cancelLabel={t('turnOffDialog.cancel')}
        confirmLabel={t('turnOffDialog.confirm')}
        pendingLabel={t('turnOffDialog.pending')}
        onConfirm={() => save(false)}
        isPending={isPending}
      />
    </>
  );
}
