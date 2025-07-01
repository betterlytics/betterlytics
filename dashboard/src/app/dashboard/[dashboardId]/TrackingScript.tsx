'use client';

import { useEffect } from 'react';

type TrackingScriptProps = {
  siteId: string;
};

export function TrackingScript({ siteId }: TrackingScriptProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `http://localhost:3006/analytics.js`;
    script.setAttribute('data-site-id', siteId);
    script.setAttribute('data-server-url', `${process.env.NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT}/track`);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [siteId]);

  return null;
}
