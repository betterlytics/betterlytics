'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setTimezoneCookieAction } from '@/app/actions/system/timezone.action';
import { useResolvedTimezone } from '@/hooks/use-resolved-timezone';

export default function TimezoneCookieInitializer() {
  const router = useRouter();
  const { timeZone } = useResolvedTimezone();

  useEffect(() => {
    setTimezoneCookieAction(timeZone).then((res) => {
      if (res.changed) {
        router.refresh();
      }
    });
  }, [timeZone, router]);

  return null;
}
