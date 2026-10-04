'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { authClient } from '@/lib/auth-client';
import { baSetGlobalProperties } from '@/lib/ba-event';

export default function GlobalPropertiesUpdater() {
  const locale = useLocale();
  const { data: session, isPending } = authClient.useSession();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (isPending) return;
    baSetGlobalProperties({ locale, logged_in: Boolean(session) });
  }, [locale, session, isPending]);

  useEffect(() => {
    if (!resolvedTheme) return;
    baSetGlobalProperties({ theme: resolvedTheme });
  }, [resolvedTheme]);

  return null;
}
