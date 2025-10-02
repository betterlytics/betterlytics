'use client';

import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useEffect } from 'react';

type TrackingScriptProps = {
  siteId: string;
};

export function TrackingScript({ siteId }: TrackingScriptProps) {
  const { PUBLIC_ANALYTICS_BASE_URL, PUBLIC_TRACKING_SERVER_ENDPOINT } = usePublicEnvironmentVariablesContext();

  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `${PUBLIC_ANALYTICS_BASE_URL}/analytics.js`;
    script.setAttribute('data-site-id', siteId);
    script.setAttribute('data-server-url', `${PUBLIC_TRACKING_SERVER_ENDPOINT}/track`);
    script.setAttribute('data-dynamic-urls', '/dashboard/*');
    script.setAttribute('data-outbound-links', 'full');
    script.setAttribute('data-web-vitals', 'true');
    script.setAttribute('data-replay', 'false');
    script.setAttribute('data-replay-sample', '100');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [siteId, PUBLIC_ANALYTICS_BASE_URL, PUBLIC_TRACKING_SERVER_ENDPOINT]);

  return null;
}
