'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun, Globe, Bell, Mail, User, BookUser } from 'lucide-react';
import { UserSettingsUpdate } from '@/entities/userSettings';
import SettingsCard from '@/components/SettingsCard';
import { DEFAULT_LANGUAGE, SupportedLanguages } from '@/dictionaries/dictionaries';
import { LanguageSelect } from '@/components/language/LanguageSelect';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

interface UserPreferencesSettingsProps {
  formData: UserSettingsUpdate;
  onUpdate: (updates: Partial<UserSettingsUpdate>) => void;
}

export default function UserPreferencesSettings({ formData, onUpdate }: UserPreferencesSettingsProps) {
  const { theme, setTheme } = useTheme();
  const { refreshSettings, settings, updateSetting } = useUserSettings();
  const { changeLanguage } = useDictionary();

  const handleLocaleChange = async (newLocale: SupportedLanguages) => {
    await changeLanguage(newLocale);
    onUpdate({ language: newLocale });
    await refreshSettings();
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    onUpdate({ theme: newTheme as 'light' | 'dark' | 'system' });
  };

  const handleAvatarChange = (newAvatar: 'default' | 'gravatar') => {
    updateSetting('avatar', newAvatar);
    onUpdate({ avatar: newAvatar });
  };

  return (
    <div className='space-y-6'>
      <SettingsCard
        icon={Monitor}
        title='Appearance'
        description='Customize the visual appearance of your dashboard'
      >
        <div className='flex items-center justify-between'>
          <Label htmlFor='theme'>Theme</Label>
          <Select value={theme} onValueChange={handleThemeChange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='light'>
                <div className='flex items-center space-x-2'>
                  <Sun className='h-4 w-4' />
                  <span>Light</span>
                </div>
              </SelectItem>
              <SelectItem value='dark'>
                <div className='flex items-center space-x-2'>
                  <Moon className='h-4 w-4' />
                  <span>Dark</span>
                </div>
              </SelectItem>
              <SelectItem value='system'>
                <div className='flex items-center space-x-2'>
                  <Monitor className='h-4 w-4' />
                  <span>System</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className='flex items-center justify-between'>
            <Label htmlFor='avatar'>Avatar</Label>
            <Select value={settings?.avatar} onValueChange={handleAvatarChange}>
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='default'>
                  <div className='flex items-center space-x-2'>
                    <User className='h-4 w-4' />
                    <span>None</span>
                  </div>
                </SelectItem>
                <SelectItem value='gravatar'>
                  <div className='flex items-center space-x-2'>
                    <BookUser className='h-4 w-4' />
                    <span>Gravatar</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {settings?.avatar === 'gravatar' && (
            <div className='text-muted-foreground pt-2 text-xs text-pretty'>
              Note: Gravatar is a third-party service - enabling it may share your email hash with their servers.
              By enabling it,{' '}
              <a href='https://wordpress.com/tos/' className='underline'>
                you agree to their terms
              </a>
              .
            </div>
          )}
        </div>
      </SettingsCard>

      <SettingsCard icon={Globe} title='Localization' description='Set your language preferences'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='language'>Language</Label>
            <LanguageSelect
              value={(formData.language as SupportedLanguages) || DEFAULT_LANGUAGE}
              onUpdate={handleLocaleChange}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard icon={Bell} title='Notifications' description='Configure your notification preferences'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Mail className='h-4 w-4' />
              <Label htmlFor='email-notifications'>Email notifications</Label>
            </div>
            <Switch
              id='email-notifications'
              checked={formData.emailNotifications ?? true}
              onCheckedChange={(checked) => onUpdate({ emailNotifications: checked })}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Mail className='h-4 w-4' />
              <Label htmlFor='marketing-emails'>Marketing emails</Label>
            </div>
            <Switch
              id='marketing-emails'
              checked={formData.marketingEmails ?? false}
              onCheckedChange={(checked) => onUpdate({ marketingEmails: checked })}
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
