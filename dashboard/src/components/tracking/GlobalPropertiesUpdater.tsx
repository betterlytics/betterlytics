'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { baSetGlobalProperties } from '@/lib/ba-event';

export default function GlobalPropertiesUpdater() {
  const locale = useLocale();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    baSetGlobalProperties({ locale, logged_in: status === 'authenticated' });
  }, [locale, status]);

  return null;
}
