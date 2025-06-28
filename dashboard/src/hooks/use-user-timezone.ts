'use client';

import { useUserSettings } from './useUserSettings';

export function useUserTimezone(): string {
  const { settings } = useUserSettings();
  return settings?.timezone || 'UTC';
}
