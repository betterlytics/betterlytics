import type { ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';

export type DemoTrailStep = { secondsFromError: number } & (
  | { event_type: 'pageview'; url: string }
  | { event_type: 'custom'; custom_event_name: string }
  | { event_type: 'outbound_link'; outbound_link_url: string }
);

export type DemoErrorOccurrence = {
  /** Relative share of the group's occurrences */
  weight: number;
  url: string;
  browser: string;
  os: string;
  device_type: string;
  country_code: string;
  stack: string;
  /** Events around the error in the session; the error itself is added at second 0 */
  trail: DemoTrailStep[];
};

export type DemoErrorGroup = {
  error_fingerprint: string;
  error_type: string;
  error_message: string;
  mechanism: string;
  status: ErrorGroupStatusValue;
  /** All-time occurrences, one session each */
  count: number;
  firstSeenMinutesAgo: number;
  lastSeenMinutesAgo: number;
  /** Where the occurrences cluster between first and last seen */
  trend: 'steady' | 'rising' | 'fading';
  /** Occurrence session ids are this prefix followed by the 5-digit occurrence index */
  sessionIdPrefix: string;
  hasReplay: boolean;
  occurrences: DemoErrorOccurrence[];
};

const HOUR = 60;
const DAY = 24 * HOUR;

// Served to public demo visitors instead of the demo site's real errors, whose messages can carry other users' URLs.
// Keep every URL a path on a public page: no dashboard or share ids, no query strings, no customer domains.
export const DEMO_ERROR_GROUPS: DemoErrorGroup[] = [
  {
    error_fingerprint: '4f1c9a7e2b8d4e06a3c5f7d9b1e2a4c6',
    error_type: 'TypeError',
    error_message: "Cannot read properties of undefined (reading 'getBoundingClientRect')",
    mechanism: 'onuncaughtexception',
    status: 'unresolved',
    count: 214,
    firstSeenMinutesAgo: 26 * DAY,
    lastSeenMinutesAgo: 7,
    trend: 'rising',
    sessionIdPrefix: '58210473916640',
    hasReplay: true,
    occurrences: [
      {
        weight: 6,
        url: '/',
        browser: 'Chrome',
        os: 'Windows',
        device_type: 'desktop',
        country_code: 'DE',
        stack: [
          "TypeError: Cannot read properties of undefined (reading 'getBoundingClientRect')",
          '    at measureHeroCard (/_next/static/chunks/app/(marketing)/page-6f3b1e0a9c2d4f87.js:1:18342)',
          '    at onScroll (/_next/static/chunks/app/(marketing)/page-6f3b1e0a9c2d4f87.js:1:19015)',
          '    at throttled (/_next/static/chunks/8217-2c4d9e1f7a6b3058.js:1:4471)',
        ].join('\n'),
        trail: [
          { secondsFromError: -48, event_type: 'pageview', url: '/' },
          { secondsFromError: -21, event_type: 'custom', custom_event_name: 'hero_cta_click' },
          { secondsFromError: 14, event_type: 'pageview', url: '/pricing' },
          { secondsFromError: 63, event_type: 'pageview', url: '/signup' },
        ],
      },
      {
        weight: 3,
        url: '/',
        browser: 'Edge',
        os: 'Windows',
        device_type: 'desktop',
        country_code: 'GB',
        stack: [
          "TypeError: Cannot read properties of undefined (reading 'getBoundingClientRect')",
          '    at measureHeroCard (/_next/static/chunks/app/(marketing)/page-6f3b1e0a9c2d4f87.js:1:18342)',
          '    at onResize (/_next/static/chunks/app/(marketing)/page-6f3b1e0a9c2d4f87.js:1:19177)',
        ].join('\n'),
        trail: [
          { secondsFromError: -9, event_type: 'pageview', url: '/' },
          { secondsFromError: 37, event_type: 'pageview', url: '/features' },
        ],
      },
      {
        weight: 1,
        url: '/',
        browser: 'Chrome',
        os: 'Android',
        device_type: 'mobile',
        country_code: 'US',
        stack: [
          "TypeError: Cannot read properties of undefined (reading 'getBoundingClientRect')",
          '    at measureHeroCard (/_next/static/chunks/app/(marketing)/page-6f3b1e0a9c2d4f87.js:1:18342)',
          '    at onScroll (/_next/static/chunks/app/(marketing)/page-6f3b1e0a9c2d4f87.js:1:19015)',
          '    at throttled (/_next/static/chunks/8217-2c4d9e1f7a6b3058.js:1:4471)',
        ].join('\n'),
        trail: [
          { secondsFromError: -72, event_type: 'pageview', url: '/blog' },
          { secondsFromError: -30, event_type: 'pageview', url: '/' },
        ],
      },
    ],
  },
  {
    error_fingerprint: '9b3e5d7f1a2c4e68b0d2f4a6c8e0b2d4',
    error_type: 'Error',
    error_message: 'ResizeObserver loop completed with undelivered notifications.',
    mechanism: 'onuncaughtexception',
    status: 'ignored',
    count: 486,
    firstSeenMinutesAgo: 88 * DAY,
    lastSeenMinutesAgo: 19,
    trend: 'steady',
    sessionIdPrefix: '71394028561173',
    hasReplay: false,
    occurrences: [
      {
        weight: 5,
        url: '/pricing',
        browser: 'Chrome',
        os: 'macOS',
        device_type: 'desktop',
        country_code: 'NL',
        stack: [
          'Error: ResizeObserver loop completed with undelivered notifications.',
          '    at ResizeObserver.observeTabs (/_next/static/chunks/app/(marketing)/pricing/page-9d2f6b8a1c4e7053.js:1:2210)',
        ].join('\n'),
        trail: [
          { secondsFromError: -12, event_type: 'pageview', url: '/pricing' },
          { secondsFromError: 41, event_type: 'custom', custom_event_name: 'pricing_toggle_yearly' },
        ],
      },
      {
        weight: 3,
        url: '/features',
        browser: 'Firefox',
        os: 'Linux',
        device_type: 'desktop',
        country_code: 'SE',
        stack: [
          'Error: ResizeObserver loop completed with undelivered notifications.',
          '    at ResizeObserver.syncStickyNav (/_next/static/chunks/app/(marketing)/layout-71c4e2a9d5b8f036.js:1:6634)',
        ].join('\n'),
        trail: [
          { secondsFromError: -25, event_type: 'pageview', url: '/' },
          { secondsFromError: -3, event_type: 'pageview', url: '/features' },
        ],
      },
    ],
  },
  {
    error_fingerprint: 'c2a4e6b8d0f2a4c6e8b0d2f4a6c8e0f1',
    error_type: 'ChunkLoadError',
    error_message: 'Loading chunk 4821 failed. (error: /_next/static/chunks/4821.8c1f2a7d9e0b3c46.js)',
    mechanism: 'onunhandledrejection',
    status: 'unresolved',
    count: 63,
    firstSeenMinutesAgo: 12 * DAY,
    lastSeenMinutesAgo: 3 * HOUR + 12,
    trend: 'fading',
    sessionIdPrefix: '30482915573306',
    hasReplay: false,
    occurrences: [
      {
        weight: 3,
        url: '/features',
        browser: 'Chrome',
        os: 'Windows',
        device_type: 'desktop',
        country_code: 'FR',
        stack: [
          'ChunkLoadError: Loading chunk 4821 failed.',
          '(error: /_next/static/chunks/4821.8c1f2a7d9e0b3c46.js)',
          '    at __webpack_require__.f.j (/_next/static/chunks/webpack-1d7e9a3c5b2f0846.js:1:3812)',
          '    at /_next/static/chunks/webpack-1d7e9a3c5b2f0846.js:1:1427',
          '    at Array.reduce (<anonymous>)',
          '    at __webpack_require__.e (/_next/static/chunks/webpack-1d7e9a3c5b2f0846.js:1:1406)',
        ].join('\n'),
        trail: [
          { secondsFromError: -340, event_type: 'pageview', url: '/' },
          { secondsFromError: -2, event_type: 'custom', custom_event_name: 'feature_tab_click' },
        ],
      },
      {
        weight: 1,
        url: '/docs',
        browser: 'Safari',
        os: 'iOS',
        device_type: 'mobile',
        country_code: 'CA',
        stack: [
          'ChunkLoadError: Loading chunk 4821 failed.',
          '(error: /_next/static/chunks/4821.8c1f2a7d9e0b3c46.js)',
          '    at __webpack_require__.f.j (/_next/static/chunks/webpack-1d7e9a3c5b2f0846.js:1:3812)',
          '    at __webpack_require__.e (/_next/static/chunks/webpack-1d7e9a3c5b2f0846.js:1:1406)',
        ].join('\n'),
        trail: [
          { secondsFromError: -95, event_type: 'pageview', url: '/docs' },
          { secondsFromError: 6, event_type: 'pageview', url: '/docs' },
        ],
      },
    ],
  },
  {
    error_fingerprint: '1d3f5b7d9f1b3d5f7a9c1e3a5c7e9b1d',
    error_type: 'TypeError',
    error_message: 'Failed to fetch',
    mechanism: 'onunhandledrejection',
    status: 'unresolved',
    count: 38,
    firstSeenMinutesAgo: 19 * DAY,
    lastSeenMinutesAgo: 52,
    trend: 'steady',
    sessionIdPrefix: '64027739184520',
    hasReplay: true,
    occurrences: [
      {
        weight: 2,
        url: '/contact',
        browser: 'Chrome',
        os: 'macOS',
        device_type: 'desktop',
        country_code: 'US',
        stack: [
          'TypeError: Failed to fetch',
          '    at submitContactForm (/_next/static/chunks/app/(marketing)/contact/page-a41e7c9d2b0f6385.js:1:2934)',
          '    at onSubmit (/_next/static/chunks/app/(marketing)/contact/page-a41e7c9d2b0f6385.js:1:3311)',
          '    at HTMLFormElement.handleSubmit (/_next/static/chunks/framework-0c7d3f5a9e1b2846.js:1:72510)',
        ].join('\n'),
        trail: [
          { secondsFromError: -150, event_type: 'pageview', url: '/pricing' },
          { secondsFromError: -84, event_type: 'pageview', url: '/contact' },
          { secondsFromError: -1, event_type: 'custom', custom_event_name: 'contact_form_submit' },
          { secondsFromError: 19, event_type: 'custom', custom_event_name: 'contact_form_submit' },
        ],
      },
      {
        weight: 1,
        url: '/contact',
        browser: 'Firefox',
        os: 'Windows',
        device_type: 'desktop',
        country_code: 'PL',
        stack: [
          'TypeError: Failed to fetch',
          '    at submitContactForm (/_next/static/chunks/app/(marketing)/contact/page-a41e7c9d2b0f6385.js:1:2934)',
          '    at onSubmit (/_next/static/chunks/app/(marketing)/contact/page-a41e7c9d2b0f6385.js:1:3311)',
        ].join('\n'),
        trail: [
          { secondsFromError: -60, event_type: 'pageview', url: '/contact' },
          { secondsFromError: -1, event_type: 'custom', custom_event_name: 'contact_form_submit' },
          {
            secondsFromError: 22,
            event_type: 'outbound_link',
            outbound_link_url: 'https://github.com/betterlytics/betterlytics',
          },
        ],
      },
    ],
  },
  {
    error_fingerprint: '7e9a1c3e5a7c9e1b3d5f7b9d1f3a5c7e',
    error_type: 'Error',
    error_message: 'Failed to fetch RSC payload for /docs/integration/nextjs. Falling back to browser navigation.',
    mechanism: 'onconsole',
    status: 'unresolved',
    count: 127,
    firstSeenMinutesAgo: 41 * DAY,
    lastSeenMinutesAgo: 34,
    trend: 'steady',
    sessionIdPrefix: '45913307628841',
    hasReplay: false,
    occurrences: [
      {
        weight: 3,
        url: '/docs',
        browser: 'Chrome',
        os: 'Windows',
        device_type: 'desktop',
        country_code: 'IN',
        stack: [
          'Error: Failed to fetch RSC payload for /docs/integration/nextjs. Falling back to browser navigation.',
          '    at fetchServerResponse (/_next/static/chunks/main-app-5e8b2d1f9c3a7046.js:1:24891)',
          '    at async navigateReducer (/_next/static/chunks/main-app-5e8b2d1f9c3a7046.js:1:31277)',
        ].join('\n'),
        trail: [
          { secondsFromError: -38, event_type: 'pageview', url: '/docs' },
          { secondsFromError: 2, event_type: 'pageview', url: '/docs/integration/nextjs' },
        ],
      },
      {
        weight: 2,
        url: '/docs/installation',
        browser: 'Edge',
        os: 'Windows',
        device_type: 'desktop',
        country_code: 'DK',
        stack: [
          'Error: Failed to fetch RSC payload for /docs/integration/nextjs. Falling back to browser navigation.',
          '    at fetchServerResponse (/_next/static/chunks/main-app-5e8b2d1f9c3a7046.js:1:24891)',
          '    at async navigateReducer (/_next/static/chunks/main-app-5e8b2d1f9c3a7046.js:1:31277)',
        ].join('\n'),
        trail: [
          { secondsFromError: -205, event_type: 'pageview', url: '/' },
          { secondsFromError: -122, event_type: 'pageview', url: '/docs/installation' },
          { secondsFromError: 3, event_type: 'pageview', url: '/docs/integration/nextjs' },
        ],
      },
    ],
  },
  {
    error_fingerprint: 'e3c5a7e9c1a3e5b7d9f1b3d5a7c9e1b3',
    error_type: 'Error',
    error_message:
      'Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.',
    mechanism: 'onuncaughtexception',
    status: 'resolved',
    count: 91,
    firstSeenMinutesAgo: 34 * DAY,
    lastSeenMinutesAgo: 4 * DAY + 5 * HOUR,
    trend: 'steady',
    sessionIdPrefix: '82750164339027',
    hasReplay: false,
    occurrences: [
      {
        weight: 2,
        url: '/blog',
        browser: 'Chrome',
        os: 'Windows',
        device_type: 'desktop',
        country_code: 'ES',
        stack: [
          'Error: Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.',
          '    at throwOnHydrationMismatch (/_next/static/chunks/framework-0c7d3f5a9e1b2846.js:1:41352)',
          '    at tryToClaimNextHydratableInstance (/_next/static/chunks/framework-0c7d3f5a9e1b2846.js:1:41806)',
          '    at beginWork (/_next/static/chunks/framework-0c7d3f5a9e1b2846.js:1:66218)',
        ].join('\n'),
        trail: [
          { secondsFromError: -1, event_type: 'pageview', url: '/blog' },
          { secondsFromError: 47, event_type: 'pageview', url: '/blog/cookieless-analytics' },
        ],
      },
      {
        weight: 1,
        url: '/blog/cookieless-analytics',
        browser: 'Safari',
        os: 'macOS',
        device_type: 'desktop',
        country_code: 'AU',
        stack: [
          'Error: Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.',
          '    at throwOnHydrationMismatch (/_next/static/chunks/framework-0c7d3f5a9e1b2846.js:1:41352)',
          '    at beginWork (/_next/static/chunks/framework-0c7d3f5a9e1b2846.js:1:66218)',
        ].join('\n'),
        trail: [
          { secondsFromError: -1, event_type: 'pageview', url: '/blog/cookieless-analytics' },
          { secondsFromError: 130, event_type: 'pageview', url: '/' },
        ],
      },
    ],
  },
  {
    error_fingerprint: '5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b',
    error_type: 'SecurityError',
    error_message: "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
    mechanism: 'onuncaughtexception',
    status: 'unresolved',
    count: 17,
    firstSeenMinutesAgo: 6 * DAY,
    lastSeenMinutesAgo: 5 * HOUR + 40,
    trend: 'steady',
    sessionIdPrefix: '27164590835512',
    hasReplay: false,
    occurrences: [
      {
        weight: 1,
        url: '/',
        browser: 'Chrome',
        os: 'Windows',
        device_type: 'desktop',
        country_code: 'CH',
        stack: [
          "SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
          '    at readThemePreference (/_next/static/chunks/app/layout-3b9f1d7e5c2a0864.js:1:912)',
          '    at ThemeScript (/_next/static/chunks/app/layout-3b9f1d7e5c2a0864.js:1:1388)',
        ].join('\n'),
        trail: [{ secondsFromError: 0, event_type: 'pageview', url: '/' }],
      },
      {
        weight: 1,
        url: '/pricing',
        browser: 'Brave',
        os: 'Linux',
        device_type: 'desktop',
        country_code: 'AT',
        stack: [
          "SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
          '    at readThemePreference (/_next/static/chunks/app/layout-3b9f1d7e5c2a0864.js:1:912)',
          '    at ThemeScript (/_next/static/chunks/app/layout-3b9f1d7e5c2a0864.js:1:1388)',
        ].join('\n'),
        trail: [
          { secondsFromError: -44, event_type: 'pageview', url: '/' },
          { secondsFromError: 0, event_type: 'pageview', url: '/pricing' },
        ],
      },
    ],
  },
  {
    error_fingerprint: 'b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8',
    error_type: 'TypeError',
    error_message: "undefined is not an object (evaluating 'window.webkit.messageHandlers')",
    mechanism: 'onuncaughtexception',
    status: 'unresolved',
    count: 9,
    firstSeenMinutesAgo: 2 * DAY + 3 * HOUR,
    lastSeenMinutesAgo: 2 * HOUR + 25,
    trend: 'rising',
    sessionIdPrefix: '93608251147736',
    hasReplay: true,
    occurrences: [
      {
        weight: 1,
        url: '/pricing',
        browser: 'Safari',
        os: 'iOS',
        device_type: 'mobile',
        country_code: 'US',
        stack: [
          "TypeError: undefined is not an object (evaluating 'window.webkit.messageHandlers')",
          '    at postToNativeShell (/_next/static/chunks/app/(marketing)/pricing/page-9d2f6b8a1c4e7053.js:1:5120)',
          '    at onPlanSelect (/_next/static/chunks/app/(marketing)/pricing/page-9d2f6b8a1c4e7053.js:1:5876)',
        ].join('\n'),
        trail: [
          { secondsFromError: -66, event_type: 'pageview', url: '/' },
          { secondsFromError: -18, event_type: 'pageview', url: '/pricing' },
          { secondsFromError: -1, event_type: 'custom', custom_event_name: 'pricing_plan_select' },
        ],
      },
    ],
  },
];
