'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setTimezoneCookieAction } from '@/app/actions/system/timezone.action';
import moment from 'moment-timezone';

export default function TimezoneCookieInitializer() {
  const router = useRouter();

  useEffect(() => {
    const tz = moment.tz.guess() ?? 'Etc/UTC';
    setTimezoneCookieAction(tz).then((res) => {
      if (res.changed) {
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
