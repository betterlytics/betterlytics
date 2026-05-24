'use client';

import { useTransition, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Trash2 } from 'lucide-react';
import { deleteUserAccountAction } from '@/app/actions/account/userSettings.action';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { toast } from 'sonner';
import UserSettingsSection from '../shared/UserSettingsSection';
import SettingRow from '../shared/SettingRow';
import { useTranslations } from 'next-intl';

export default function UserDangerZoneSettings() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const t = useTranslations('components.userSettings.danger');

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error(t('toast.unable'));
      return;
    }

    startTransition(async () => {
      const result = await deleteUserAccountAction();
      if (result.success) {
        toast.success(t('toast.success'));
        await signOut({ callbackUrl: '/' });
      } else {
        toast.error(result.error.message || t('toast.error'));
      }
    });
  };

  return (
    <UserSettingsSection title={t('sectionTitle')}>
      <SettingRow
        label={t('delete')}
        description={t('details')}
        action={
          <Button
            variant='destructive'
            size='sm'
            disabled={isPending}
            onClick={() => setIsDialogOpen(true)}
            className='cursor-pointer'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            {t('delete')}
          </Button>
        }
      />

      <DestructiveActionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={t('dialog.title')}
        description={t('dialog.description')}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.confirm')}
        onConfirm={handleDeleteAccount}
        isPending={isPending}
        countdownSeconds={5}
        showIcon
      >
        <div className='text-muted-foreground space-y-2 text-sm'>
          <ul className='list-inside list-disc space-y-1'>
            <li>{t('dialog.li1')}</li>
            <li>{t('dialog.li2')}</li>
            <li>{t('dialog.li3')}</li>
            <li>{t('dialog.li4')}</li>
          </ul>
        </div>
      </DestructiveActionDialog>
    </UserSettingsSection>
  );
}
