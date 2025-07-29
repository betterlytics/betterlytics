'use client';

import { useEffect } from 'react';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';
import betterlytics from '@betterlytics/tracker';

export function BetterlyticsTracker() {
  useEffect(() => {
    fetchPublicEnvironmentVariablesAction().then((env) => {
      if (env.PUBLIC_ENABLE_APP_TRACKING && env.PUBLIC_APP_TRACKING_SITE_ID) {
        betterlytics.init(env.PUBLIC_APP_TRACKING_SITE_ID, {
          scriptUrl: `${env.PUBLIC_ANALYTICS_BASE_URL}/analytics.js`,
          serverUrl: `${env.PUBLIC_TRACKING_SERVER_ENDPOINT}/track`,
          dynamicUrls: ['/dashboard/*/funnels/*', '/dashboard/*'],
        });
      }
    });
  }, []);
  return <></>;
}
