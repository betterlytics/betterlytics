'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun, LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUserSettingsPreview } from '@/contexts/UserSettingsPreviewContext';
import { Theme } from '@prisma/client';
import { UserSettingsUpdate } from '@/entities/userSettings';

const THEME_ICONS: Record<Theme, LucideIcon> = {
  [Theme.light]: Sun,
  [Theme.dark]: Moon,
  [Theme.system]: Monitor,
};

interface UserThemeSelectorProps {
  value: Theme | undefined;
  onUpdate: (theme: Theme) => void;
}

export default function UserThemeSelector({ value, onUpdate }: UserThemeSelectorProps) {
  const { setTheme } = useTheme();
  const t = useTranslations('components.userSettings.preferences.appearance');
  const { register, unregister } = useUserSettingsPreview();

  useEffect(() => {
    register('theme', (settings: UserSettingsUpdate) => {
      if (settings.theme) {
        setTheme(settings.theme);
      }
    });

    return () => unregister('theme');
  }, [register, unregister, setTheme]);

  const handleChange = (newTheme: string) => {
    onUpdate(newTheme as Theme);
  };

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="theme">{t('themeLabel')}</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-32 cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(Theme).map((theme) => {
            const Icon = THEME_ICONS[theme];
            return (
              <SelectItem key={theme} value={theme} className="cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{t(theme)}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
