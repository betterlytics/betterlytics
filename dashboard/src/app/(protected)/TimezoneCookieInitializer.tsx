'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setTimezoneCookieAction } from '@/app/actions/system/timezone';

export default function TimezoneCookieInitializer() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    setTimezoneCookieAction(tz).then((res) => {
      if (res.changed) {
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
