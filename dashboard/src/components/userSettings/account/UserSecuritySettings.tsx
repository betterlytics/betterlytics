'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import UserSettingsSection from '../shared/UserSettingsSection';
import SettingRow from '../shared/SettingRow';
import UserSecurityTotpSettings from './UserSecurityTotpSettings';
import ChangePasswordDialog from './ChangePasswordDialog';
import { getPasswordStatusAction } from '@/app/actions/account/userSettings.action';

export default function UserSecuritySettings() {
  const t = useTranslations('components.userSettings.security');
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  useEffect(() => {
    getPasswordStatusAction()
      .then((result) => setHasPassword(result.success ? result.data : false))
      .catch(() => setHasPassword(false));
  }, []);

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
        description={hasPassword === false ? t('passwordManagedByOAuth') : t('description')}
        action={
          hasPassword === false ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>{changePasswordButton}</span>
              </TooltipTrigger>
              <TooltipContent>{t('passwordManagedByOAuth')}</TooltipContent>
            </Tooltip>
          ) : (
            changePasswordButton
          )
        }
      />

      <UserSecurityTotpSettings hasPassword={hasPassword} />

      <ChangePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
    </UserSettingsSection>
  );
}
