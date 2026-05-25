'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import UserSettingsSection from '../shared/UserSettingsSection';
import SettingRow from '../shared/SettingRow';
import UserSecurityTotpSettings from './UserSecurityTotpSettings';
import ChangePasswordDialog from './ChangePasswordDialog';

export default function UserSecuritySettings() {
  const { data: session } = useSession();
  const t = useTranslations('components.userSettings.security');
  const hasPassword = Boolean(session?.user?.hasPassword);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const changePasswordButton = (
    <Button
      variant='outline'
      size='sm'
      onClick={() => setIsPasswordDialogOpen(true)}
      disabled={!hasPassword}
      className='cursor-pointer'
    >
      {t('changePassword')}
    </Button>
  );

  return (
    <UserSettingsSection title={t('title')}>
      <SettingRow
        label={t('passwordRowLabel')}
        description={hasPassword ? t('description') : t('passwordManagedByOAuth')}
        action={
          hasPassword ? (
            changePasswordButton
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>{changePasswordButton}</span>
              </TooltipTrigger>
              <TooltipContent>{t('passwordManagedByOAuth')}</TooltipContent>
            </Tooltip>
          )
        }
      />

      <UserSecurityTotpSettings />

      <ChangePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
    </UserSettingsSection>
  );
}
