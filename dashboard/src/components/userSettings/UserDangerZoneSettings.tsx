'use client';

import { useTransition, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Trash2 } from 'lucide-react';
import { deleteUserAccountAction } from '@/app/actions/account/userSettings.action';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { toast } from 'sonner';
import UserSettingsSection from './UserSettingsSection';
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
      try {
        await deleteUserAccountAction();
        toast.success(t('toast.success'));
        window.location.href = '/';
      } catch (error) {
        console.error('Failed to delete account:', error);
        toast.error(t('toast.error'));
      }
    });
  };

  return (
    <UserSettingsSection title={t('sectionTitle')}>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='text-sm font-medium'>{t('delete')}</div>
          <p className='text-muted-foreground text-xs'>{t('details')}</p>
        </div>
        <div className='flex-shrink-0'>
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
        </div>
      </div>

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
