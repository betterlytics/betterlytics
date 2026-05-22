'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, BookUser } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import type { AvatarMode } from '@prisma/client';
import UserSettingsSection from './UserSettingsSection';
import type { SupportedLanguages } from '@/constants/i18n';
import { LanguageSelect } from '@/components/language/LanguageSelect';
import ExternalLink from '@/components/ExternalLink';
import UserThemeSelector from './UserThemeSelector';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useUserSettings } from '@/contexts/UserSettingsProvider';
import { useUserSettingsMutation } from '@/hooks/use-user-settings-mutation';
import {
  updateUserAvatarAction,
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
  const marketingEmailsMutation = useUserSettingsMutation({ action: updateUserMarketingEmailsAction });

  return (
    <div>
      <UserSettingsSection title={t('appearance.title')}>
        <div className='flex items-center justify-between gap-4'>
          <div className='space-y-1'>
            <Label htmlFor='theme' className='text-sm font-medium'>
              {t('appearance.themeLabel')}
            </Label>
            <p className='text-muted-foreground text-xs'>{t('appearance.themeDescription')}</p>
          </div>
          <div className='flex-shrink-0'>
            <UserThemeSelector
              value={settings.theme}
              onUpdate={(theme) => themeMutation.mutate({ theme })}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-4'>
            <div className='space-y-1'>
              <Label htmlFor='avatar' className='text-sm font-medium'>
                {t('avatar.label')}
              </Label>
              <p className='text-muted-foreground text-xs'>{t('avatar.description')}</p>
            </div>
            <div className='flex-shrink-0'>
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
          </div>
          {settings.avatar === 'gravatar' && (
            <p className='text-muted-foreground text-xs text-pretty'>
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
            </p>
          )}
        </div>
      </UserSettingsSection>

      <UserSettingsSection title={t('localization.title')}>
        <div className='flex items-center justify-between gap-4'>
          <div className='space-y-1'>
            <Label htmlFor='language' className='text-sm font-medium'>
              {t('localization.language')}
            </Label>
            <p className='text-muted-foreground text-xs'>{t('localization.languageDescription')}</p>
          </div>
          <div className='flex-shrink-0'>
            <LanguageSelect
              value={settings.language as SupportedLanguages}
              onUpdate={(language) => languageMutation.mutate({ language })}
            />
          </div>
        </div>
      </UserSettingsSection>

      {PUBLIC_IS_CLOUD && (
        <UserSettingsSection title={t('notifications.title')}>
          <div className='flex items-center justify-between gap-4'>
            <div className='space-y-1'>
              <Label htmlFor='marketing-emails' className='text-sm font-medium'>
                {t('notifications.marketingEmails')}
              </Label>
              <p className='text-muted-foreground text-xs'>
                {t('notifications.marketingEmailsDescription')}
              </p>
            </div>
            <Switch
              id='marketing-emails'
              checked={settings.marketingEmails}
              onCheckedChange={(marketingEmails) => marketingEmailsMutation.mutate({ marketingEmails })}
              className='cursor-pointer'
            />
          </div>
        </UserSettingsSection>
      )}
    </div>
  );
}
