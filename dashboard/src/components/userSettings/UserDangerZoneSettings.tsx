'use client';

import { useTransition, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { UserSettingsUpdate } from '@/entities/account/userSettings.entities';
import { deleteUserAccountAction } from '@/app/actions/account/userSettings.action';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { toast } from 'sonner';
import SettingsCard from '@/components/SettingsCard';
import { useTranslations } from 'next-intl';

interface UserDangerZoneSettingsProps {
  formData: UserSettingsUpdate;
  onUpdate: (updates: Partial<UserSettingsUpdate>) => void;
}

export default function UserDangerZoneSettings({ formData, onUpdate }: UserDangerZoneSettingsProps) {
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
        await signOut({ callbackUrl: '/' });
      } catch (error) {
        console.error('Failed to delete account:', error);
        toast.error(t('toast.error'));
      }
    });
  };

  return (
    <div className='space-y-6'>
      <SettingsCard icon={Trash2} title={t('title')} description={t('description')}>
        <div className='space-y-4'>
          <div className='border-destructive/20 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4'>
            <AlertTriangle className='text-destructive mt-0.5 h-5 w-5 flex-shrink-0' />
            <div className='text-sm'>
              <p className='text-destructive mb-1 font-medium'>{t('warning')}</p>
              <p className='text-muted-foreground'>{t('details')}</p>
            </div>
          </div>

          <Button
            variant='destructive'
            disabled={isPending}
            onClick={() => setIsDialogOpen(true)}
            className='hover:bg-destructive/80 dark:hover:bg-destructive/80 bg-destructive/85 w-full cursor-pointer sm:w-auto'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            {t('delete')}
          </Button>

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
        </div>
      </SettingsCard>
    </div>
  );
}
