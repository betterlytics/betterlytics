import {
  PublicStatusPageDataSchema,
  STATUS_PAGE_DEFAULT_ACCENT_COLOR,
  STATUS_PAGE_LIMITS,
  type PublicDailyUptimeBucket,
  type PublicMonitorStatus,
  type PublicStatusPageData,
  type PublicStatusPageMonitor,
} from '@/entities/analytics/statusPage.entities';

/**
 * Fixture status pages, keyed by slug, used while the public page UI is being
 * validated against the design (PUBLIC_STATUS_PAGE_DESIGN.md §10 M1). Each slug
 * exercises a different state: themes, banner states, sparse data, monitor
 * counts and localization. Kept after real data wiring as test fixtures.
 */

const WINDOW_DAYS = STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS;

type DayOverride = { daysAgo: number; upRatio: number | null };

function isoDay(daysAgo: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function isoDaysAgo(daysAgo: number, hourUtc = 19, minuteUtc = 21): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hourUtc, minuteUtc, 0, 0);
  return d.toISOString();
}

/** 90 daily buckets, oldest first: ratio 1 unless overridden; null before `firstDataDaysAgo`. */
function buildDays(overrides: DayOverride[] = [], firstDataDaysAgo?: number): PublicDailyUptimeBucket[] {
  const byDaysAgo = new Map(overrides.map((o) => [o.daysAgo, o.upRatio]));
  return Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const daysAgo = WINDOW_DAYS - 1 - i;
    const overridden = byDaysAgo.has(daysAgo) ? byDaysAgo.get(daysAgo)! : 1;
    const upRatio = firstDataDaysAgo != null && daysAgo > firstDataDaysAgo ? null : overridden;
    return { date: isoDay(daysAgo), upRatio };
  });
}

function monitor(
  key: string,
  publicName: string,
  status: PublicMonitorStatus,
  uptime: number | null,
  days: PublicDailyUptimeBucket[],
): PublicStatusPageMonitor {
  return { key, publicName, status, uptime, days };
}

const baseMonitors = (): PublicStatusPageMonitor[] => [
  monitor('0', 'Website', 'operational', 99.99, buildDays([{ daysAgo: 66, upRatio: 0.97 }])),
  monitor(
    '1',
    'API',
    'operational',
    99.95,
    buildDays([
      { daysAgo: 79, upRatio: 0.96 },
      { daysAgo: 48, upRatio: 0.62 },
      { daysAgo: 47, upRatio: 0.97 },
      { daysAgo: 9, upRatio: 0.984 },
    ]),
  ),
  monitor('2', 'Dashboard', 'operational', 99.98, buildDays([{ daysAgo: 22, upRatio: 0.98 }])),
  monitor('3', 'CDN & Assets', 'operational', 100, buildDays([], 61)),
];

const resolvedApiIncident = {
  title: 'API elevated error rates',
  body: 'A deploy introduced elevated 5xx responses on the API. We rolled back and confirmed recovery.',
  impact: 'outage' as const,
  status: 'resolved' as const,
  monitorPublicName: 'API',
  startedAt: isoDaysAgo(9),
  resolvedAt: isoDaysAgo(9, 19, 44),
};

const FIXTURES: Record<string, () => PublicStatusPageData> = {
  demo: () => ({
    name: 'Northwind Status',
    slug: 'demo',
    logoUrl: null,
    homepageUrl: null,
    noindex: false,
    accentColor: STATUS_PAGE_DEFAULT_ACCENT_COLOR,
    theme: 'light',
    overallStatus: 'operational',
    lastUpdatedAt: isoMinutesAgo(1),
    overallUptime: 99.98,
    monitors: baseMonitors(),
    incidents: [resolvedApiIncident],
  }),

  'demo-dark': () => ({ ...FIXTURES['demo'](), slug: 'demo-dark', theme: 'dark' }),
  'demo-system': () => ({ ...FIXTURES['demo'](), slug: 'demo-system', theme: 'system' }),

  'demo-degraded': () => {
    const monitors = baseMonitors();
    monitors[1] = {
      ...monitors[1],
      status: 'degraded',
      uptime: 99.62,
      days: monitors[1].days.map((d, i) => (i === monitors[1].days.length - 1 ? { ...d, upRatio: 0.93 } : d)),
    };
    return {
      ...FIXTURES['demo'](),
      slug: 'demo-degraded',
      theme: 'dark',
      overallStatus: 'degraded',
      overallUptime: 99.89,
      monitors,
      incidents: [
        {
          title: 'API degraded performance',
          body: "We're investigating elevated error rates and slow responses on the API.",
          impact: 'degraded' as const,
          status: 'investigating' as const,
          monitorPublicName: 'API',
          startedAt: isoMinutesAgo(21),
          resolvedAt: null,
        },
        resolvedApiIncident,
      ],
    };
  },

  'demo-outage': () => {
    const monitors = baseMonitors().map((m) => ({
      ...m,
      status: 'down' as const,
      uptime: m.uptime == null ? null : Math.min(m.uptime, 98.4),
      days: m.days.map((d, i) => (i >= m.days.length - 1 ? { ...d, upRatio: 0.42 } : d)),
    }));
    return {
      ...FIXTURES['demo'](),
      slug: 'demo-outage',
      overallStatus: 'outage',
      overallUptime: 98.31,
      monitors,
      incidents: [
        {
          title: 'Website unreachable',
          body: "The website is currently unreachable. We've identified a network issue and are working on it.",
          impact: 'outage' as const,
          status: 'identified' as const,
          monitorPublicName: 'Website',
          startedAt: isoMinutesAgo(48),
          resolvedAt: null,
        },
        {
          title: 'API outage',
          body: 'The API is returning server errors. We are investigating.',
          impact: 'outage' as const,
          status: 'investigating' as const,
          monitorPublicName: 'API',
          startedAt: isoMinutesAgo(52),
          resolvedAt: null,
        },
        resolvedApiIncident,
      ],
    };
  },

  'demo-unknown': () => ({
    name: 'Northwind Status',
    slug: 'demo-unknown',
    logoUrl: null,
    homepageUrl: null,
    noindex: false,
    accentColor: STATUS_PAGE_DEFAULT_ACCENT_COLOR,
    theme: 'light',
    overallStatus: 'unknown',
    lastUpdatedAt: isoMinutesAgo(1),
    overallUptime: null,
    monitors: [
      monitor('0', 'Website', 'unknown', null, buildDays([], -1)),
      monitor('1', 'API', 'unknown', null, buildDays([], -1)),
    ],
    incidents: [],
  }),

  'demo-many': () => ({
    name: 'Northwind Status',
    slug: 'demo-many',
    logoUrl: null,
    homepageUrl: null,
    noindex: false,
    accentColor: '#22c55e',
    theme: 'light',
    overallStatus: 'operational',
    lastUpdatedAt: isoMinutesAgo(1),
    overallUptime: 99.91,
    monitors: [
      ...baseMonitors(),
      monitor('4', 'Background job processing pipeline (EU region)', 'operational', 99.72, buildDays([{ daysAgo: 12, upRatio: 0.9 }])),
      monitor('5', 'Ingestion', 'operational', 99.99, buildDays()),
      monitor('6', 'Webhooks', 'degraded', 99.41, buildDays([{ daysAgo: 0, upRatio: 0.95 }])),
      monitor('7', 'Documentation', 'operational', 100, buildDays([], 30)),
      monitor('8', 'Auth', 'operational', 99.97, buildDays([{ daysAgo: 41, upRatio: 0.93 }])),
      monitor('9', 'Search', 'unknown', null, buildDays([], -1)),
    ],
    incidents: [resolvedApiIncident],
  }),

  // Single monitor + past-incidents section disabled by the owner (incidents: null)
  'demo-single': () => ({
    name: 'Northwind Status',
    slug: 'demo-single',
    logoUrl: null,
    homepageUrl: null,
    noindex: false,
    accentColor: '#0ea5e9',
    theme: 'light',
    overallStatus: 'operational',
    lastUpdatedAt: isoMinutesAgo(1),
    overallUptime: 99.99,
    monitors: [monitor('0', 'Website', 'operational', 99.99, buildDays())],
    incidents: null,
  }),
};

export function getStatusPageFixture(slug: string): PublicStatusPageData | null {
  const fixture = FIXTURES[slug];
  if (!fixture) return null;
  return PublicStatusPageDataSchema.parse(fixture());
}
