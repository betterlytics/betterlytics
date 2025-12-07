'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useUserSettings } from '@/hooks/useUserSettings';

export default function UserThemeInitializer() {
  const { settings, isLoading } = useUserSettings();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    if (settings?.theme && settings.theme !== theme) {
      setTheme(settings.theme);
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
