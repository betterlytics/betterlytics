'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun, Globe, Bell, Mail } from 'lucide-react';
import { UserSettingsUpdate } from '@/entities/userSettings';
import SettingsCard from '@/components/SettingsCard';

interface UserPreferencesSettingsProps {
  formData: UserSettingsUpdate;
  onUpdate: (updates: Partial<UserSettingsUpdate>) => void;
}

export default function UserPreferencesSettings({ formData, onUpdate }: UserPreferencesSettingsProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    onUpdate({ theme: newTheme as 'light' | 'dark' | 'system' });
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
      </SettingsCard>

      <SettingsCard icon={Globe} title='Localization' description='Set your language and timezone preferences'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='language'>Language</Label>
            <Select value={formData.language || 'en'} onValueChange={(value) => onUpdate({ language: value })}>
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='en'>English</SelectItem>
                <SelectItem value='da'>Dansk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='timezone'>Timezone</Label>
            <Select value={formData.timezone || 'UTC'} onValueChange={(value) => onUpdate({ timezone: value })}>
              <SelectTrigger className='w-40'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='UTC'>UTC</SelectItem>
                <SelectItem value='Europe/Copenhagen'>Europe/Copenhagen (UTC+2)</SelectItem>
              </SelectContent>
            </Select>
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
