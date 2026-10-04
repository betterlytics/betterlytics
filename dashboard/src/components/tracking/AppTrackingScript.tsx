import Script from 'next/script';
import { env } from '@/lib/env';

/** Collapsed to one URL each, so every dashboard or share id isn't its own page. */
const DYNAMIC_URLS = [
  '/dashboard/*/errors/detail/*',
  '/dashboard/*/funnels/*',
  '/dashboard/*/monitoring/*',
  '/dashboard/*/status-pages/*',
  '/dashboard/*',
  '/share/*/errors/detail/*',
  '/*/share/*/errors/detail/*',
  '/share/*/funnels/*',
  '/*/share/*/funnels/*',
  '/share/*/monitoring/*',
  '/*/share/*/monitoring/*',
  '/share/*/status-pages/*',
  '/*/share/*/status-pages/*',
  '/share/*',
  '/*/share/*',
  '/accept-invite/*',
  '/*/accept-invite/*',
  '/status/*',
].join(',');

type GlobalProperties = {
  surface: 'app';
  locale: string;
  /** Omit where the page must not read the session; `GlobalPropertiesUpdater` sets it after load. */
  logged_in?: boolean;
  /** Pages without a theme provider set it here; elsewhere `GlobalPropertiesUpdater` does. */
  theme?: 'light' | 'dark';
};

export function AppTrackingScript({ globalProperties }: { globalProperties: GlobalProperties }) {
  if (!env.ENABLE_APP_TRACKING) return null;
  return (
    <Script
      async
      src={`${env.PUBLIC_ANALYTICS_BASE_URL}/analytics.js`}
      data-site-id={env.APP_TRACKING_SITE_ID}
      data-server-url={`${env.PUBLIC_TRACKING_SERVER_ENDPOINT}/event`}
      data-dynamic-urls={DYNAMIC_URLS}
      data-web-vitals='true'
      data-track-errors='true'
      data-track-console-errors='true'
      data-global-properties={JSON.stringify(globalProperties)}
    />
  );
}
