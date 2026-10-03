'use client';

import { useTransition, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { Trash2 } from 'lucide-react';
import {
  deleteUserAccountAction,
  getAccountDeletionBlockerAction,
} from '@/app/actions/account/userSettings.action';
import { Button } from '@/components/ui/button';
import { DestructiveActionDialog } from '@/components/dialogs';
import { toast } from 'sonner';
import UserSettingsSection from '../shared/UserSettingsSection';
import SettingRow from '../shared/SettingRow';
import { useTranslations } from 'next-intl';
import type { AccountDeletionBlocker } from '@/entities/account/userSettings.entities';

const BLOCKER_MESSAGE_KEYS = {
  last_admin: 'lastAdmin',
  last_user: 'lastUser',
} as const satisfies Record<AccountDeletionBlocker, string>;

export default function UserDangerZoneSettings() {
  const { data: session } = authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const t = useTranslations('components.userSettings.danger');

  const { data: deletionBlocker, isLoading: isBlockerLoading } = useQuery({
    queryKey: ['accountDeletionBlocker'],
    queryFn: async () => {
      const result = await getAccountDeletionBlockerAction();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
  const isBlocked = Boolean(deletionBlocker);

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error(t('toast.unable'));
      return;
    }

    startTransition(async () => {
      const result = await deleteUserAccountAction();
      if (result.success) {
        toast.success(t('toast.success'));
        await authClient.signOut();
        window.location.href = '/';
      } else {
        toast.error(result.error.message || t('toast.error'));
      }
    });
  };

  return (
    <UserSettingsSection title={t('sectionTitle')}>
      <SettingRow
        label={t('delete')}
        description={deletionBlocker ? t(BLOCKER_MESSAGE_KEYS[deletionBlocker]) : t('details')}
        action={
          <Button
            variant='destructive'
            size='sm'
            disabled={isPending || isBlockerLoading || isBlocked}
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
