'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun, Globe, Bell, Mail, User, BookUser } from 'lucide-react';
import { UserSettingsUpdate } from '@/entities/userSettings';
import SettingsCard from '@/components/SettingsCard';
import type { SupportedLanguages } from '@/constants/i18n';
import { LanguageSelect } from '@/components/language/LanguageSelect';
import ExternalLink from '@/components/ExternalLink';
import { useTranslations } from 'next-intl';
import { useSettingsEffects } from '@/contexts/SettingsEffectsContext';

interface UserPreferencesSettingsProps {
  formData: UserSettingsUpdate;
  onUpdate: (updates: Partial<UserSettingsUpdate>) => void;
}

export default function UserPreferencesSettings({ formData, onUpdate }: UserPreferencesSettingsProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('components.userSettings.preferences');
  const { registerEffect } = useSettingsEffects();

  useEffect(() => {
    const originalTheme = theme;

    registerEffect('theme', {
      apply: (settings: UserSettingsUpdate) => {
        if (settings.theme) {
          setTheme(settings.theme);
        }
      },
      revert: () => {
        if (originalTheme) {
          setTheme(originalTheme);
        }
      },
    });
  }, [registerEffect, setTheme, theme]);

  const handleLocaleChange = (newLocale: SupportedLanguages) => {
    onUpdate({ language: newLocale });
  };

  const handleThemeChange = (newTheme: string) => {
    onUpdate({ theme: newTheme as 'light' | 'dark' | 'system' });
  };

  const handleAvatarChange = (newAvatar: 'default' | 'gravatar') => {
    onUpdate({ avatar: newAvatar });
  };

  return (
    <div className='space-y-6'>
      <SettingsCard icon={Monitor} title={t('appearance.title')} description={t('appearance.description')}>
        <div className='flex items-center justify-between'>
          <Label htmlFor='theme'>{t('appearance.themeLabel')}</Label>
          <Select value={formData.theme} onValueChange={handleThemeChange}>
            <SelectTrigger className='w-32 cursor-pointer'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='light' className='cursor-pointer'>
                <div className='flex items-center space-x-2'>
                  <Sun className='h-4 w-4' />
                  <span>{t('appearance.light')}</span>
                </div>
              </SelectItem>
              <SelectItem value='dark' className='cursor-pointer'>
                <div className='flex items-center space-x-2'>
                  <Moon className='h-4 w-4' />
                  <span>{t('appearance.dark')}</span>
                </div>
              </SelectItem>
              <SelectItem value='system' className='cursor-pointer'>
                <div className='flex items-center space-x-2'>
                  <Monitor className='h-4 w-4' />
                  <span>{t('appearance.system')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className='flex items-center justify-between'>
            <Label htmlFor='avatar'>{t('avatar.label')}</Label>
            <Select value={formData.avatar} onValueChange={handleAvatarChange}>
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
          {formData.avatar === 'gravatar' && (
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
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='language'>{t('localization.language')}</Label>
            <LanguageSelect
              value={formData.language as SupportedLanguages}
              onUpdate={handleLocaleChange}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard icon={Bell} title={t('notifications.title')} description={t('notifications.description')}>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Mail className='h-4 w-4' />
              <Label htmlFor='email-notifications'>{t('notifications.emailNotifications')}</Label>
            </div>
            <Switch
              id='email-notifications'
              checked={formData.emailNotifications ?? true}
              onCheckedChange={(checked) => onUpdate({ emailNotifications: checked })}
              className='cursor-pointer'
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Mail className='h-4 w-4' />
              <Label htmlFor='marketing-emails'>{t('notifications.marketingEmails')}</Label>
            </div>
            <Switch
              id='marketing-emails'
              checked={formData.marketingEmails ?? false}
              onCheckedChange={(checked) => onUpdate({ marketingEmails: checked })}
              className='cursor-pointer'
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
