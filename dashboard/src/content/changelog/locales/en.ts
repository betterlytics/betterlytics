import type { ChangelogEntryData } from '@/entities/system/changelog.entities';

export const latestChangelogModalEn: ChangelogEntryData = {
  metadata: {
    version: 'v1.3.5',
    releasedAt: '2026-02-19',
    title: 'Keyword Monitoring & Visual Refinements',
    summary:
      'Uptime monitors can now alert when expected keywords are missing from your pages, and dashboards feel smoother with animated gauges, numbers, and other visual touches.',
  },
  sections: [
    {
      id: 'v135-new-features',
      title: 'New Features',
      blocks: [
        {
          type: 'list',
          items: [
            'Uptime monitors can now check for an expected keyword in the page response, alerting you if critical content goes missing, even when the page still returns a 200 status.',
          ],
        },
      ],
    },
    {
      id: 'v135-improvements',
      title: 'Improvements',
      blocks: [
        {
          type: 'list',
          items: [
            'Core Web Vitals scores now display in an animated gauge, making it easier to read performance at a glance.',
            'Chart tooltips now clarify when a week or month bucket is only partially covered by the selected time range.',
            'Numbers, loading indicators, and other small visual touches have been refined for a smoother, more polished feel across the dashboard.',
          ],
        },
      ],
    },
  ],
};

export const changelogEntriesEn: readonly ChangelogEntryData[] = [
  {
    metadata: {
      version: 'v1.3.5',
      releasedAt: '2026-02-19',
      title: 'Keyword Monitoring & Visual Refinements',
      summary:
        'Uptime monitors can now alert when expected keywords are missing from your pages, and dashboards feel smoother with animated gauges, numbers, and other visual touches.',
    },
    sections: [
      {
        id: 'v135-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'Uptime monitors can now check for an expected keyword in the page response, alerting you if critical content goes missing — even when the page still returns a 200 status.',
            ],
          },
        ],
      },
      {
        id: 'v135-improvements',
        title: 'Improvements',
        blocks: [
          {
            type: 'list',
            items: [
              'Core Web Vitals scores now display in an animated gauge, making it easier to read performance at a glance.',
              'Chart tooltips now clarify when a week or month bucket is only partially covered by the selected time range.',
              'Numbers, loading indicators, and other small visual touches have been refined for a smoother, more polished feel across the dashboard.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.4',
      releasedAt: '2026-02-08',
      title: 'Email Reports & Weekly & Monthly Insights',
      summary:
        'Receive scheduled email reports for your dashboards and explore trends with week and month granularity for longer time ranges.',
    },
    sections: [
      {
        id: 'v134-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'Schedule email reports with analytics summaries for your dashboards directly from settings.',
              'Longer time ranges now support weekly and monthly granularity, making it easier to spot long-term trends.',
            ],
          },
        ],
      },
      {
        id: 'v134-improvements',
        title: 'Improvements',
        blocks: [
          {
            type: 'list',
            items: [
              "Scroll depth tracking events are now included at no extra cost and don't count toward your monthly usage quota.",
              'The filter selector now shows how many filters are actively applied.',
              'Table cells now display comparison data more clearly when one period has no data.',
            ],
          },
        ],
      },
      {
        id: 'v134-fixes',
        title: 'Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Resolved an issue where the tracking script could send invalid data.',
              'Corrected a date calculation issue that could show incorrect time ranges.',
              'Email verification is now properly triggered for OAuth sign-ups.',
              'Comparison indicators now display correct values when data is null or unchanged.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.3',
      releasedAt: '2026-01-26',
      title: 'Scroll Depth & Enhanced Onboarding',
      summary:
        'Track scroll depth to understand engagement and drop-off, and get set up faster with new framework onboarding guides.',
    },
    sections: [
      {
        id: 'v133-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'See how far users scroll down your pages to better understand content engagement and scrolling behavior.',
              'Expanded onboarding guides with clearer, step-by-step installation instructions for many more frameworks.',
            ],
          },
        ],
      },
      {
        id: 'v133-improvements-and-ux',
        title: 'Improvements & UX',
        blocks: [
          {
            type: 'list',
            items: [
              'Collapsible Sidebar: Sidebar categories are now collapsible, giving you more control over your navigation space.',
              'Improved Core Web Vitals indicators make it easier to spot when metrics cross into "Fair" or "Poor" thresholds.',
              'Usage Quota Reset: Added a clear label to the usage summary showing when your monthly quota resets.',
              'UI polish: Added subtle animations throughout the app for a smoother, more responsive feel.',
            ],
          },
        ],
      },
      {
        id: 'v133-fixes',
        title: 'Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Fixed an issue where Realtime did not properly refresh, causing outdated data to be shown.',
              'Fixed an issue where Session Replay sometimes failed to save recorded sessions.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.2',
      releasedAt: '2026-01-19',
      title: 'Bug Fixes & UI Polish',
      summary: "A smaller release this time! We've squashed a few bugs and polished up the interface.",
    },
    sections: [
      {
        id: 'v132-fixes',
        title: 'Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Fixed an issue where dashboard settings appeared editable for team members without admin permissions.',
              'Fixed a problem where searching in filters stopped working after selecting multiple values.',
            ],
          },
        ],
      },
      {
        id: 'v132-improvements',
        title: 'Improvements',
        blocks: [
          {
            type: 'list',
            items: ['Various minor UI improvements for a more polished experience.'],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.1',
      releasedAt: '2026-01-11',
      title: 'Team Collaboration & Security Hardening',
      summary:
        'Invite team members to collaborate on your dashboards with role-based access. This release also strengthens account security, improves privacy isolation, and adds support for changing your dashboard domain.',
    },
    sections: [
      {
        id: 'v131-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'Invite team members to your dashboard as Viewer, Editor, or Admin, with role-based permissions to safely collaborate.',
              'Filters now support OR logic, allowing you to match multiple values within a single filter (for example, multiple pages or countries).',
              'You can now change your dashboard domain in settings. Your Site ID and tracking script remain unchanged, so no code updates are needed.',
            ],
          },
        ],
      },
      {
        id: 'v131-security',
        title: 'Security',
        blocks: [
          {
            type: 'list',
            items: [
              'Changing your password now invalidates all other active sessions.',
              'Password resets now sign out all existing sessions for added protection.',
            ],
          },
        ],
      },
      {
        id: 'v131-improvements',
        title: 'Improvements',
        blocks: [
          {
            type: 'list',
            items: [
              'Improved privacy protections to better isolate visitor data between sites.',
              'Fixed layout spacing in the uptime monitoring list on larger screens.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.3.0',
      releasedAt: '2026-01-04',
      title: 'Uptime & SSL Monitoring, Clearer User Journeys',
      summary:
        'Betterlytics now helps you monitor website uptime and SSL health with alerts for outages and expirations. This release also makes User Journeys easier to explore and improves accuracy across analytics views.',
    },
    sections: [
      {
        id: 'v130-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'Website uptime monitoring is now available. Track uptime, latency, and incidents for your websites and get notified when something goes wrong.',
              'SSL certificate monitoring is included with uptime monitoring, so you’ll be alerted before certificates expire or become invalid.',
              'User Journey paths can now be locked in the Sankey diagram, making it easier to trace and follow specific user flows in complex journeys.',
            ],
          },
        ],
      },
      {
        id: 'v130-improvements',
        title: 'Improvements',
        blocks: [
          {
            type: 'list',
            items: [
              'User Journey Sankey diagrams have been further visually refined to reduce clutter and make paths easier to follow.',
              'Funnel creation now suggests a more complete set of filter values, helping you build accurate funnels faster.',
              'Browser and device reporting has been improved with more recognizable icons.',
              'The pricing page now includes a clearer plan comparison table to make feature differences easier to understand.',
            ],
          },
        ],
      },
      {
        id: 'v130-fixes',
        title: 'Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Fixed an issue where some campaign metrics were mislabeled.',
              'Improved scrolling behavior and performance in the events table.',
            ],
          },
        ],
      },
      {
        id: 'v130-maintenance',
        title: 'Maintenance',
        blocks: [
          {
            type: 'list',
            items: ['General security and dependency updates to keep Betterlytics stable and secure.'],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.9',
      releasedAt: '2025-12-21',
      title: 'Saved Filters, Hostname Filtering & User Journey Improvements',
      summary:
        'Save your favorite filter combinations for quick access, filter analytics by hostname for multi-subdomain setups, and User Journey gets some finishing touches for smoother large diagrams.',
    },
    sections: [
      {
        id: 'v129-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'You can now save filter combinations and quickly apply them later. Perfect for frequently used views or complex filtering setups you want to revisit.',
              'Hostname filtering is here! If you have multiple subdomains pointing to the same dashboard, you can now filter your analytics by hostname to see data for specific subdomains.',
            ],
          },
        ],
      },
      {
        id: 'v129-improvements',
        title: 'Improvements',
        blocks: [
          {
            type: 'list',
            items: [
              'User Journey received some finishing touches. Large diagrams now flow more smoothly and are easier to follow at a glance.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.8',
      releasedAt: '2025-12-14',
      title: 'Redesigned User Journey, funnel cloning, and platform reliability improvements',
      summary:
        'User Journey gets a complete visual refresh, funnels can now be cloned, and reliability and accuracy improvements enhance user experience',
    },
    sections: [
      {
        id: 'v128-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'User Journey visualization has been redesigned with a fresh, modern interface that makes it easier to understand how visitors navigate your site.',
              'You can now clone existing funnels to quickly create variations or test different configurations without starting from scratch.',
            ],
          },
        ],
      },
      {
        id: 'v128-security',
        title: 'Security',
        blocks: [
          {
            type: 'list',
            items: [
              'Updated Next.js and React to patch recently disclosed security vulnerabilities, keeping your data and accounts secure.',
            ],
          },
        ],
      },
      {
        id: 'v128-improvements-and-fixes',
        title: 'Improvements & Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'User Journey data accuracy has been improved for more reliable insights into visitor paths.',
              'Geography map and weekly heatmap colors have been updated to better highlight differences in visitor numbers, making patterns easier to spot at a glance.',
              'Fixed an issue where password changes were not working for accounts that signed in with email and password instead of social login providers.',
              'Settings changes now require clicking "Save" before taking effect, preventing accidental modifications.',
              'Fixed a bug where comparison range tooltips displayed incorrect dates.',
              'Resolved an issue where chart annotations could prevent charts from rendering properly.',
              'Introduced a new /event tracking endpoint with clearer semantics and improved alignment with our privacy-first architecture. Existing /track integrations continue to work without changes.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.7',
      releasedAt: '2025-12-07',
      title: 'Chart annotations, campaign-first view, and security hardening',
      summary:
        'The campaign page now centers on named UTM campaigns, main charts support annotations, authentication is strengthened, and several reliability fixes improve accuracy and safety.',
    },
    sections: [
      {
        id: 'v127-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'The Campaign page has been fully rebuilt to focus on named UTM campaigns, providing clearer, more meaningful insights than the previous aggregated view.',
              'You can now add annotations to main charts to highlight important events, releases, or traffic changes.',
              'Delete a dashboard now includes a short safety countdown to prevent accidental removal.',
            ],
          },
        ],
      },
      {
        id: 'v127-security-auth',
        title: 'Security & Authentication',
        blocks: [
          {
            type: 'list',
            items: [
              'Authentication has been strengthened, improving session integrity and protection.',
              'Patched the recent React Server Components vulnerability (CVE-2025-66478) by updating to the latest secure Next.js release.',
            ],
          },
        ],
      },
      {
        id: 'v127-improvements-and-fixes',
        title: 'Improvements & Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Fixed a race condition that could create duplicate subscriptions when new accounts were created.',
              'Corrected page-per-session calculations in the Pages view so metrics now accurately reflect actual usage.',
              'Account verification now provides clearer feedback during the verification process.',
              'The changelog popup layout is now optimized for small screens, improving readability on mobile devices.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.6',
      releasedAt: '2025-12-01',
      title: 'Redesigned Funnels & Smarter Map',
      summary:
        'Funnels are fully redesigned with improved visualizations. World map interactions now include comparison features and better tooltips. This release also includes bug fixes and updated translations.',
    },
    sections: [
      {
        id: 'v126-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              "Funnels page has a brand-new, visual layout that's easier to use and understand.",
              'World map now supports period-over-period comparisons.',
              'World map tooltips now show clearer insights with improved performance.',
            ],
          },
        ],
      },
      {
        id: 'v126-enhancements',
        title: 'Enhancements',
        blocks: [
          {
            type: 'list',
            items: ['Added missing translations so users worldwide get a smoother experience.'],
          },
        ],
      },
      {
        id: 'v126-bug-fixes',
        title: 'Bug Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Fixed duplicate notifications when exceeding plan limits.',
              'Fixed loading problems when choosing future date ranges.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.5',
      releasedAt: '2025-11-24',
      title: 'More precise data, more control',
      summary: 'Improved data integrity, tighter controls on incoming traffic, and a series of reliability fixes.',
    },
    sections: [
      {
        id: 'v125-new-features',
        title: 'New Features',
        blocks: [
          {
            type: 'list',
            items: [
              'Compare data over selected periods directly in the world map visualization.',
              'Block events from specific IP addresses to avoid skewed or unwanted traffic (e.g., your own visits).',
              "Automatically reject events from domains that don't match your dashboard domain.",
            ],
          },
        ],
      },
      {
        id: 'v125-enhancements',
        title: 'Enhancements',
        blocks: [
          {
            type: 'list',
            items: [
              'Core Web Vitals labels refined for clearer understanding.',
              'Antarctica is hidden from the world map unless it has visitor data.',
              'Added an in-app "Report a bug" button for quick feedback submissions.',
              'Added favicons to dashboard domains.',
            ],
          },
        ],
      },
      {
        id: 'v125-bug-fixes',
        title: 'Bug Fixes',
        blocks: [
          {
            type: 'list',
            items: [
              'Fixed an issue causing the Core Web Vitals page to fail loading.',
              'Resolved daylight saving time issues affecting displayed analytics.',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.4',
      releasedAt: '2025-11-16',
      title: 'Live Demo Workspace & Refreshed Landing Page',
      summary:
        'This update introduces a new live demo workspace, a redesigned landing page, and improved internal performance monitoring to keep dashboards fast and reliable.',
    },
    sections: [
      {
        id: 'v124-live-demo-workspace',
        title: 'Live Demo Workspace',
        blocks: [
          {
            type: 'text',
            body: 'You can now explore Betterlytics using a fully interactive demo workspace.',
          },
          {
            type: 'list',
            items: [
              'Browse dashboards, funnels, and tables with pre-populated sample data',
              'Test filters, breakdowns, and comparisons without touching production data',
              "Share the demo with teammates to preview the platform's capabilities",
            ],
          },
        ],
      },
      {
        id: 'v124-redesigned-landing-page',
        title: 'Redesigned Landing Page',
        blocks: [
          {
            type: 'text',
            body: 'The public website has been updated with clearer messaging, new visuals, and improved navigation to help visitors understand what Betterlytics offers.',
          },
          {
            type: 'list',
            items: [
              'Updated copy highlighting core features like analytics, funnels, and session replay',
              'New screenshots that reflect the current product for mobile view',
            ],
          },
        ],
      },
      {
        id: 'v124-performance-monitoring',
        title: 'Improved Performance Monitoring',
        blocks: [
          {
            type: 'text',
            body: "We've strengthened the platform's internal performance telemetry to detect slowdowns earlier and keep dashboards responsive.",
          },
          {
            type: 'list',
            items: [
              'Faster identification of issues affecting query times or loading speed',
              'Better insights into environment behaviour for a more stable experience',
              'A stronger foundation for ongoing performance improvements',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.3',
      releasedAt: '2025-10-26',
      title: 'Smarter Search, Clearer Filters & Stability Improvements',
      summary:
        'This update introduces improved search and filtering, more informative visualizations, better session replay controls, and several stability and UX enhancements.',
    },
    sections: [
      {
        id: 'v123-search-filters',
        title: 'Improved Search & Filters',
        blocks: [
          {
            type: 'text',
            body: 'Search and filtering now scale better with large datasets, making it easier to find the information you need.',
          },
          {
            type: 'list',
            items: [
              'Richer search options for quickly discovering key events, pages, and properties',
              'More responsive overview tables with sensible limits for large workspaces',
              'Filter settings are now reflected in the URL, making filtered views easy to bookmark and share',
              'Fixes to filter selection and hierarchical tables for more reliable breakdowns',
            ],
          },
        ],
      },
      {
        id: 'v123-visual-context',
        title: 'More Context in Visualizations',
        blocks: [
          {
            type: 'text',
            body: 'Several visual components now surface extra detail to help you interpret trends faster and with fewer clicks.',
          },
          {
            type: 'list',
            items: [
              'Expandable device details showing specific browsers and platforms',
              'Weekly heatmaps with hover tooltips for exact counts and timestamps',
              '"No change" summaries to clearly highlight stable comparison periods',
            ],
          },
        ],
      },
      {
        id: 'v123-session-replay',
        title: 'Session Replay Improvements',
        blocks: [
          {
            type: 'text',
            body: 'Session replays are now more reliable and accurate, so you can confidently review user interactions without missing key events or encountering inconsistencies.',
          },
          {
            type: 'list',
            items: [
              'More reliable and accurate recordings of user interactions',
              'Improved playback of sessions so key actions are captured correctly',
            ],
          },
        ],
      },
      {
        id: 'v123-timezone-alignment',
        title: 'Dashboard Timezone Alignment',
        blocks: [
          {
            type: 'text',
            body: "Dashboards now reflect each user's local time for more intuitive reporting.",
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.2',
      releasedAt: '2025-10-20',
      title: 'Privacy-First Session Replay & Faster Dashboards',
      summary:
        'This release introduces anonymized session replay, performance improvements across dashboards, and updated translations for a smoother global experience.',
    },
    sections: [
      {
        id: 'v122-session-replay',
        title: 'Privacy-First Session Replay',
        blocks: [
          {
            type: 'text',
            body: 'Session replay is now available, letting you watch anonymized recordings of how visitors interact with your site. Sensitive information, such as text, form inputs, and images, is automatically masked to protect user privacy.',
          },
          {
            type: 'list',
            items: [
              'Understand where users hesitate, scroll, or drop off',
              'Identify frustration signals like rage clicks',
              'Share replays with your team without exposing personal data',
            ],
          },
        ],
      },
      {
        id: 'v122-faster-dashboards',
        title: 'Faster, Smoother Dashboards',
        blocks: [
          {
            type: 'text',
            body: 'We have reduced unnecessary re-renders across core views so dashboards feel snappier, especially on larger workspaces. Navigating between reports and applying filters should now feel more responsive.',
          },
        ],
      },
      {
        id: 'v122-translation-improvements',
        title: 'Translation Improvements',
        blocks: [
          {
            type: 'text',
            body: 'Missing translations and inconsistent phrasing have been updated, providing a more polished experience for international teams.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.1',
      releasedAt: '2025-09-22',
      title: 'Smarter Time Ranges & More Accurate Overview Metrics',
      summary:
        'This release adds richer time and comparison ranges, fixes inconsistencies in overview metrics, and improves accessibility and mobile usability.',
    },
    sections: [
      {
        id: 'v121-time-comparison',
        title: 'Smarter Time & Comparison Ranges',
        blocks: [
          {
            type: 'text',
            body: 'Time range controls now offer more preset options and clearer comparison choices, helping you answer common reporting questions faster.',
          },
          {
            type: 'list',
            items: [
              'Quickly switch to ranges like last 24 hours, last 7 days, last 14 days, or last quarter',
              'Compare performance to the previous period or last year, with the option to align weekdays for cleaner comparisons',
              'Time and comparison selectors are now separate for better clarity and control',
            ],
          },
        ],
      },
      {
        id: 'v121-overview-metrics',
        title: 'More Accurate Overview Metrics',
        blocks: [
          {
            type: 'text',
            body: 'Several accuracy improvements ensure more reliable reporting across the overview page.',
          },
          {
            type: 'list',
            items: [
              'Summary card values now stay fully synced with underlying charts and tables',
              'Pageview counting has been refined so inactive background tabs no longer inflate totals',
            ],
          },
        ],
      },
      {
        id: 'v121-accessibility',
        title: 'Improved Accessibility & Mobile Usability',
        blocks: [
          {
            type: 'text',
            body: 'We have continued to refine the overall usability of Betterlytics, especially for people signing in and for teams working on smaller screens.',
          },
          {
            type: 'list',
            items: [
              'Login forms now work more smoothly with keyboard navigation and assistive technologies',
              'Mobile layouts have been enhanced for easier interaction with dashboards and controls on smaller screens',
            ],
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.2.0',
      releasedAt: '2025-09-14',
      title: 'Weekly Heatmap, Full Site Redesign & Core Web Vitals',
      summary:
        'This update introduces a full redesign of the Betterlytics website, a weekly engagement heatmap, updated overview metrics, guided onboarding for new workspaces, and real-user Core Web Vitals tracking.',
    },
    sections: [
      {
        id: 'v120-redesign',
        title: 'Full Website & Dashboard Redesign',
        blocks: [
          {
            type: 'text',
            body: 'The entire website and all dashboards have been updated with a refreshed visual theme, unified colors, consistent typography, and improved layout. Navigation, tables, charts, dialogs, and tooltips have all been refined for a cleaner, more intuitive experience on both desktop and mobile.',
          },
        ],
      },
      {
        id: 'v120-weekly-heatmap',
        title: 'Weekly Engagement Heatmap',
        blocks: [
          {
            type: 'text',
            body: 'The overview page now includes a weekly heatmap showing traffic patterns by day and hour. Quickly spot peak periods, quiet hours, and unusual spikes in activity at a glance.',
          },
        ],
      },
      {
        id: 'v120-overview-context',
        title: 'More Context in Overview Charts',
        blocks: [
          {
            type: 'text',
            body: 'Two new metric cards have been added to the overview chart: total session count and average visit duration. This makes it easier to connect high-level traffic trends with how long people actually stay on your site.',
          },
        ],
      },
      {
        id: 'v120-sparkline-trends',
        title: 'More Detailed Sparkline Trends',
        blocks: [
          {
            type: 'text',
            body: 'Summary card sparklines now support finer-grained time buckets, giving you a clearer view of how metrics move inside a selected range. Short-lived spikes and dips are easier to spot without opening a full report.',
          },
        ],
      },
      {
        id: 'v120-guided-onboarding',
        title: 'Guided Onboarding for New Users',
        blocks: [
          {
            type: 'text',
            body: 'New accounts now receive a step-by-step onboarding flow that covers adding the tracking script and exploring core dashboards, making setup faster and more approachable.',
          },
        ],
      },
      {
        id: 'v120-core-web-vitals',
        title: 'Real-User Core Web Vitals',
        blocks: [
          {
            type: 'text',
            body: 'Betterlytics now captures Core Web Vitals directly from real visitor sessions, giving you an accurate view of site performance in the wild. Use these metrics to identify and address regressions before they affect conversions.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.1.1',
      releasedAt: '2025-08-24',
      title: 'Outbound Link Tracking, Faster Time Ranges & Italian Localization',
      summary:
        'You can now track outbound link clicks, use new quick time-range options for faster analysis, and access Betterlytics in Italian.',
    },
    sections: [
      {
        id: 'v111-outbound-links',
        title: 'Outbound Link Tracking',
        blocks: [
          {
            type: 'text',
            body: 'Outbound link tracking is now available, showing which external destinations receive the most engagement. This helps you measure the performance of CTAs that lead to partners, documentation, or other external sites.',
          },
        ],
      },
      {
        id: 'v111-time-range-shortcuts',
        title: 'Faster Time Range Shortcuts',
        blocks: [
          {
            type: 'text',
            body: 'The time range selector now includes more quick options and granular intervals, making it easier to jump to common reporting windows or zoom in on trends without manual date selection.',
          },
        ],
      },
      {
        id: 'v111-italian-localization',
        title: 'Italian Localization',
        blocks: [
          {
            type: 'text',
            body: 'The dashboard is now available in Italian, offering a more natural experience for Italian-speaking teams across navigation, reports, and settings.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.1.0',
      releasedAt: '2025-08-15',
      title: 'Localized Dashboards, Smarter Maps & Richer Comparisons',
      summary:
        'Dashboards are now available in multiple languages, the world map is more intuitive to explore, and comparison values appear in more charts and progress indicators.',
    },
    sections: [
      {
        id: 'v110-dashboard-localization',
        title: 'Dashboard Localization',
        blocks: [
          {
            type: 'text',
            body: 'All major dashboard pages are now localized, allowing teams to browse navigation, labels, and metrics in their preferred language.',
          },
        ],
      },
      {
        id: 'v110-world-map',
        title: 'Improved World Map Interactions',
        blocks: [
          {
            type: 'text',
            body: 'The world map has been refined to make regions easier to hover, select, and compare. Smaller and densely packed areas now respond more smoothly, and regional groupings are clearer at a glance.',
          },
        ],
      },
      {
        id: 'v110-comparison-values',
        title: 'Expanded Comparison Values',
        blocks: [
          {
            type: 'text',
            body: 'More charts and progress bars now include hover tooltips with comparison values, making it easier to see how current performance compares to your baseline without switching views.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.2',
      releasedAt: '2025-08-13',
      title: 'Cleaner World Map Data & More Accurate Event Tracking',
      summary:
        'This update improves the clarity of the world map visualization and introduces smarter URL normalization for more accurate event reporting.',
    },
    sections: [
      {
        id: 'v102-world-map',
        title: 'World Map Improvements',
        blocks: [
          {
            type: 'text',
            body: 'The world map has been refreshed with clearer visuals and country flags, making it easier to scan and understand where your traffic is coming from. Contrast and iconography have been improved for better readability.',
          },
        ],
      },
      {
        id: 'v102-cleaner-urls',
        title: 'Cleaner Event URLs',
        blocks: [
          {
            type: 'text',
            body: 'Event URLs are now automatically normalized, removing variations like trailing slashes or "www", so similar traffic is grouped correctly for more consistent reporting.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.1',
      releasedAt: '2025-08-11',
      title: 'Social Login, Funnels & Gravatar Avatars',
      summary:
        'This update introduces Google and GitHub sign-in options, new funnel analytics for tracking drop-offs, and optional Gravatar-based avatars for workspaces.',
    },
    sections: [
      {
        id: 'v101-social-login',
        title: 'Google & GitHub Sign-In',
        blocks: [
          {
            type: 'text',
            body: 'Users can now sign in with Google or GitHub for easier onboarding and a quicker sign-up process.',
          },
        ],
      },
      {
        id: 'v101-funnels',
        title: 'Funnels for Drop-Off Analysis',
        blocks: [
          {
            type: 'text',
            body: 'Funnels are now available, letting you visualize how users move through multi-step journeys and where they drop off. Use this to optimize sign-up flows, onboarding, and other key conversions.',
          },
        ],
      },
      {
        id: 'v101-gravatar',
        title: 'Gravatar Avatars',
        blocks: [
          {
            type: 'text',
            body: 'Users can now enable Gravatar-based profile images, offering simple, recognizable avatars without needing uploads.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v1.0.0',
      releasedAt: '2025-08-01',
      title: 'Betterlytics 1.0 Launch + Two-Factor Authentication',
      summary:
        'The first stable release of Betterlytics introduces a reliable analytics experience along with optional two-factor authentication (TOTP) for enhanced account security.',
    },
    sections: [
      {
        id: 'v100-launch',
        title: 'Betterlytics 1.0',
        blocks: [
          {
            type: 'text',
            body: 'Version 1.0 marks the first stable release of Betterlytics, bundling the core dashboard experience into a production-ready product for teams that care about privacy-friendly analytics.',
          },
        ],
      },
      {
        id: 'v100-totp',
        title: 'Two-Factor Authentication (TOTP)',
        blocks: [
          {
            type: 'text',
            body: 'Users can now enable time-based one-time passwords (TOTP) for their accounts, adding an extra layer of security on top of passwords. Any standard authenticator app can be used.',
          },
        ],
      },
    ],
  },
  {
    metadata: {
      version: 'v0.1.0',
      releasedAt: '2025-04-25',
      title: 'Early Foundations of Betterlytics',
      summary:
        'We started building Betterlytics with a focus on privacy-friendly analytics, an intuitive dashboard, and a fast, reliable event pipeline.',
    },
    sections: [
      {
        id: 'v010-project-kickoff',
        title: 'Project Kickoff',
        blocks: [
          {
            type: 'text',
            body: 'Development began with a small internal prototype combining an event pipeline, initial dashboard, and early charting experiments. From day one, the goal was to make product and marketing analytics trustworthy, actionable, and privacy-compliant (GDPR-ready).',
          },
        ],
      },
      {
        id: 'v010-performance-architecture',
        title: 'Performance-Focused Architecture',
        blocks: [
          {
            type: 'text',
            body: 'Unlike many open-source analytics platforms built in JavaScript or other similar languages, we prioritized speed and scalability. Early decisions included using Rust for efficient computation and ClickHouse for high-performance data storage, ensuring the platform could handle large datasets without slowing down.',
          },
        ],
      },
      {
        id: 'v010-foundations',
        title: 'Foundations, Not Features',
        blocks: [
          {
            type: 'text',
            body: 'During this pre-1.0 period, the focus was on building the underlying architecture rather than public-facing features: designing storage, shaping the data model, and refining query performance before opening up broader access.',
          },
        ],
      },
    ],
  },
] as const;
