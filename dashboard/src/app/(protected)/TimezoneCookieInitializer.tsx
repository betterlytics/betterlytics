'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setTimezoneCookieAction } from '@/app/actions/timezone';

export default function TimezoneCookieInitializer() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    setTimezoneCookieAction(tz).then((res) => {
      if (res?.success && res.data.changed) {
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
