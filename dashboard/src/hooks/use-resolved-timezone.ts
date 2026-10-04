'use client';

import { useMemo } from 'react';
import { useOptionalUserSettings } from '@/contexts/UserSettingsProvider';
import { detectBrowserTimezone, resolveTimezone } from '@/utils/timezone';

export function useResolvedTimezone() {
  const settingTimezone = useOptionalUserSettings()?.timezone;
  const browserTimeZone = useMemo(() => detectBrowserTimezone(), []);

  return useMemo(
    () => ({ ...resolveTimezone(settingTimezone, browserTimeZone), browserTimeZone }),
    [settingTimezone, browserTimeZone],
  );
}
