'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import UserSettingsSection from './UserSettingsSection';
import UserSecurityTotpSettings from './UserSecurityTotpSettings';
import ChangePasswordDialog from './ChangePasswordDialog';

export default function UserSecuritySettings() {
  const { data: session } = useSession();
  const t = useTranslations('components.userSettings.security');
  const hasPassword = Boolean(session?.user?.hasPassword);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <UserSettingsSection title={t('title')}>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='text-sm font-medium'>{t('passwordRowLabel')}</div>
          <p className='text-muted-foreground text-xs'>
            {hasPassword ? t('description') : t('passwordManagedByOAuth')}
          </p>
        </div>
        <div className='flex-shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsPasswordDialogOpen(true)}
            disabled={!hasPassword}
            className='cursor-pointer'
          >
            {t('changePassword')}
          </Button>
        </div>
      </div>

      <UserSecurityTotpSettings />

      <ChangePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
    </UserSettingsSection>
  );
}
