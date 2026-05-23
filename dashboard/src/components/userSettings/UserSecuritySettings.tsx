'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import UserSettingsSection from './UserSettingsSection';
import SettingRow from './SettingRow';
import UserSecurityTotpSettings from './UserSecurityTotpSettings';
import ChangePasswordDialog from './ChangePasswordDialog';

export default function UserSecuritySettings() {
  const { data: session } = useSession();
  const t = useTranslations('components.userSettings.security');
  const hasPassword = Boolean(session?.user?.hasPassword);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <UserSettingsSection title={t('title')}>
      <SettingRow
        label={t('passwordRowLabel')}
        description={hasPassword ? t('description') : t('passwordManagedByOAuth')}
        action={
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsPasswordDialogOpen(true)}
            disabled={!hasPassword}
            className='cursor-pointer'
          >
            {t('changePassword')}
          </Button>
        }
      />

      <UserSecurityTotpSettings />

      <ChangePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
    </UserSettingsSection>
  );
}
