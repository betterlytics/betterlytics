'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { baSetGlobalProperties } from '@/lib/ba-event';

export default function GlobalPropertiesUpdater() {
  const locale = useLocale();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    baSetGlobalProperties({ locale, logged_in: Boolean(session) });
  }, [locale, session, isPending]);

  return null;
}
