'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setTimezoneCookieAction } from '@/app/actions/system/timezone.action';
import moment from 'moment-timezone';

function resolveTimezone() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!tz || tz === 'Etc/Unknown') {
    return moment.tz.guess();
  }

  return tz;
}

export default function TimezoneCookieInitializer() {
  const router = useRouter();

  useEffect(() => {
    const tz = resolveTimezone();
    setTimezoneCookieAction(tz).then((res) => {
      if (res.changed) {
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
