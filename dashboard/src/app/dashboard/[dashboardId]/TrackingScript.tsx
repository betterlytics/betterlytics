'use client';

import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useEffect } from 'react';

type TrackingScriptProps = {
  siteId: string;
};

export function TrackingScript({ siteId }: TrackingScriptProps) {
  const { NEXT_PUBLIC_ANALYTICS_BASE_URL, NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT } =
    usePublicEnvironmentVariablesContext();

  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `${NEXT_PUBLIC_ANALYTICS_BASE_URL}/analytics.js`;
    script.setAttribute('data-site-id', siteId);
    script.setAttribute('data-server-url', `${NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT}/track`);
    script.setAttribute('data-dynamic-urls', '/dashboard/*');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [siteId, NEXT_PUBLIC_ANALYTICS_BASE_URL, NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT]);

  return null;
}
