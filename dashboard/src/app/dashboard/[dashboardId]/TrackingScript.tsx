'use client';

import { env } from '@/lib/env';
import { useEffect } from 'react';

type TrackingScriptProps = {
  siteId: string;
};

export function TrackingScript({ siteId }: TrackingScriptProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `${env.NEXT_PUBLIC_ANALYTICS_BASE_URL}/analytics.js`;
    script.setAttribute('data-site-id', siteId);
    script.setAttribute('data-server-url', `${env.NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT}/track`);
    script.setAttribute('data-dynamic-urls', '/dashboard/*');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [siteId]);

  return null;
}
