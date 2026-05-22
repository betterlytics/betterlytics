'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Globe, Bell, Mail, User, BookUser } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import type { AvatarMode } from '@prisma/client';
import SettingsCard from '@/components/SettingsCard';
import type { SupportedLanguages } from '@/constants/i18n';
import { LanguageSelect } from '@/components/language/LanguageSelect';
import ExternalLink from '@/components/ExternalLink';
import UserThemeSelector from './UserThemeSelector';
import SettingStatusIndicator from './SettingStatusIndicator';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useUserSettings } from '@/contexts/UserSettingsProvider';
import { useUserSettingsMutation } from '@/hooks/use-user-settings-mutation';
import {
  updateUserAvatarAction,
  updateUserEmailNotificationsAction,
  updateUserLanguageAction,
  updateUserMarketingEmailsAction,
  updateUserThemeAction,
} from '@/app/actions/account/userSettings.action';

export default function UserPreferencesSettings() {
  const t = useTranslations('components.userSettings.preferences');
  const { PUBLIC_IS_CLOUD } = usePublicEnvironmentVariablesContext();
  const settings = useUserSettings();
  const { setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  const themeMutation = useUserSettingsMutation({ action: updateUserThemeAction });
  const languageMutation = useUserSettingsMutation({
    action: updateUserLanguageAction,
    onSuccess: () => router.refresh(),
  });
  const avatarMutation = useUserSettingsMutation({ action: updateUserAvatarAction });
  const emailNotificationsMutation = useUserSettingsMutation({ action: updateUserEmailNotificationsAction });
  const marketingEmailsMutation = useUserSettingsMutation({ action: updateUserMarketingEmailsAction });

  return (
    <div className='space-y-6'>
      <SettingsCard icon={Monitor} title={t('appearance.title')} description={t('appearance.description')}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Label htmlFor='theme'>{t('appearance.themeLabel')}</Label>
            <SettingStatusIndicator status={themeMutation.status} />
          </div>
          <UserThemeSelector value={settings.theme} onUpdate={(theme) => themeMutation.mutate({ theme })} />
        </div>

        <div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Label htmlFor='avatar'>{t('avatar.label')}</Label>
              <SettingStatusIndicator status={avatarMutation.status} />
            </div>
            <Select
              value={settings.avatar}
              onValueChange={(v) => avatarMutation.mutate({ avatar: v as AvatarMode })}
            >
              <SelectTrigger className='w-32 cursor-pointer'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='default' className='cursor-pointer'>
                  <div className='flex items-center space-x-2'>
                    <User className='h-4 w-4' />
                    <span>{t('avatar.none')}</span>
                  </div>
                </SelectItem>
                <SelectItem value='gravatar' className='cursor-pointer'>
                  <div className='flex items-center space-x-2'>
                    <BookUser className='h-4 w-4' />
                    <span>{t('avatar.gravatar')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {settings.avatar === 'gravatar' && (
            <div className='text-muted-foreground pt-2 text-xs text-pretty'>
              {t('avatar.noteIntro')}{' '}
              <ExternalLink
                href='https://wordpress.com/tos/'
                className='underline'
                target='__blank'
                rel='noopener noreferrer'
              >
                {t('avatar.terms')}
              </ExternalLink>
              .
            </div>
          )}
        </div>
      </SettingsCard>

      <SettingsCard icon={Globe} title={t('localization.title')} description={t('localization.description')}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Label htmlFor='language'>{t('localization.language')}</Label>
            <SettingStatusIndicator status={languageMutation.status} />
          </div>
          <LanguageSelect
            value={settings.language as SupportedLanguages}
            onUpdate={(language) => languageMutation.mutate({ language })}
          />
        </div>
      </SettingsCard>

      <SettingsCard icon={Bell} title={t('notifications.title')} description={t('notifications.description')}>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Mail className='h-4 w-4' />
              <Label htmlFor='email-notifications'>{t('notifications.emailNotifications')}</Label>
              <SettingStatusIndicator status={emailNotificationsMutation.status} />
            </div>
            <Switch
              id='email-notifications'
              checked={settings.emailNotifications}
              onCheckedChange={(emailNotifications) => emailNotificationsMutation.mutate({ emailNotifications })}
              className='cursor-pointer'
            />
          </div>

          {PUBLIC_IS_CLOUD && (
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Mail className='h-4 w-4' />
                <Label htmlFor='marketing-emails'>{t('notifications.marketingEmails')}</Label>
                <SettingStatusIndicator status={marketingEmailsMutation.status} />
              </div>
              <Switch
                id='marketing-emails'
                checked={settings.marketingEmails}
                onCheckedChange={(marketingEmails) => marketingEmailsMutation.mutate({ marketingEmails })}
                className='cursor-pointer'
              />
            </div>
          )}
        </div>
      </SettingsCard>
    </div>
  );
}
