import 'server-only';

import moment from 'moment-timezone';
import { DEMO_CAMPAIGNS, type DemoCampaign } from '@/constants/demoCampaigns';
import type * as campaignRepository from '@/repositories/clickhouse/campaign.repository';
import type { CampaignAudienceProfileRow } from '@/repositories/clickhouse/campaign.repository';
import type {
  CampaignTrendRow,
  RawCampaignData,
  RawCampaignLandingPagePerformanceItem,
  RawCampaignUTMBreakdownItem,
  UTMDimension,
} from '@/entities/analytics/campaign.entities';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toDateTimeString } from '@/utils/dateFormatters';

type RawMetrics = Omit<RawCampaignData, 'utm_campaign_name'>;
type WeightedLabels = DemoCampaign['sources'];
type Period = 'day' | 'week';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Distinct visitors per bucket add up to a bit more than distinct visitors over the whole range
const BUCKET_OVERLAP = 1.1;

// Relative traffic per UTC hour for a European audience with a US evening tail
const UTC_HOUR_WEIGHTS = [
  0.35, 0.25, 0.2, 0.2, 0.25, 0.4, 0.65, 0.9, 1, 1, 0.95, 0.95, 1, 1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6,
  0.55, 0.45,
];

const UTM_DIMENSION_FIELD = {
  source: 'sources',
  medium: 'mediums',
  content: 'contents',
  term: 'terms',
} as const satisfies Record<UTMDimension, keyof DemoCampaign>;

const AUDIENCE_DIMENSION_FIELD = {
  device: 'devices',
  country: 'countries',
  browser: 'browsers',
  os: 'operatingSystems',
} as const satisfies Record<CampaignAudienceProfileRow['dimension'], keyof DemoCampaign>;

const BUCKET_STEP: Record<string, { amount: number; unit: moment.unitOfTime.DurationConstructor }> = {
  minute_15: { amount: 15, unit: 'minutes' },
  minute_30: { amount: 30, unit: 'minutes' },
  hour: { amount: 1, unit: 'hour' },
  day: { amount: 1, unit: 'day' },
};

// Deterministic value in [0, 1), so the same window always renders the same numbers
function hashToUnit(...parts: Array<string | number>): number {
  let hash = 0x811c9dc5;
  for (const char of parts.join('|')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0x100000000;
}

function jitter(spread: number, ...parts: Array<string | number>): number {
  return 1 + (hashToUnit(...parts) * 2 - 1) * spread;
}

// Largest remainder rounding, so a small total still lands on the biggest items instead of rounding to zero
function apportion(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0 || weightSum <= 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (total * weight) / weightSum);
  const counts = exact.map(Math.floor);
  let remaining = total - counts.reduce((sum, count) => sum + count, 0);
  const byRemainder = exact.map((value, index) => ({ index, remainder: value - Math.floor(value) }));
  byRemainder.sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (remaining <= 0) break;
    counts[index] += 1;
    remaining -= 1;
  }
  return counts;
}

function resolvePeriod(siteQuery: BASiteQuery): { period: Period; scale: number } {
  // The range end is the last second of the range
  const hours = (siteQuery.endDate.getTime() - siteQuery.startDate.getTime() + 1000) / HOUR_MS;
  const period: Period = hours <= 48 ? 'day' : 'week';
  const ratio = hours / (period === 'day' ? 24 : 24 * 7);
  return { period, scale: Math.abs(ratio - 1) < 0.05 ? 1 : ratio };
}

function toRawMetrics(campaign: DemoCampaign, visitors: number, quality: number): RawMetrics {
  const sessions = Math.max(visitors, Math.round(visitors * campaign.sessionsPerVisitor));
  return {
    total_visitors: visitors,
    total_sessions: sessions,
    bounced_sessions: Math.round(sessions * Math.min(0.95, campaign.bounceRate * quality)),
    total_pageviews: Math.max(sessions, Math.round((sessions * campaign.pagesPerSession) / quality)),
    sum_session_duration_seconds: Math.round((sessions * campaign.avgSessionSeconds) / quality),
  };
}

function campaignVisitors(campaign: DemoCampaign, siteQuery: BASiteQuery): number {
  const { period, scale } = resolvePeriod(siteQuery);
  const share = period === 'week' ? 1 : campaign.last24hShare;
  return Math.max(1, Math.round(campaign.visitors * share * scale));
}

// The last 24 hours get their own mix rather than a scaled copy of the week
function periodQuality(campaign: DemoCampaign, period: Period, label = ''): number {
  return period === 'week' ? 1 : jitter(0.12, campaign.name, label, 'day');
}

function campaignMetrics(campaign: DemoCampaign, siteQuery: BASiteQuery): RawMetrics {
  const { period } = resolvePeriod(siteQuery);
  return toRawMetrics(campaign, campaignVisitors(campaign, siteQuery), periodQuality(campaign, period));
}

function splitVisitors(campaign: DemoCampaign, items: WeightedLabels, siteQuery: BASiteQuery): number[] {
  const { period } = resolvePeriod(siteQuery);
  const weights = items.map(([label, weight]) =>
    period === 'week' ? weight : weight * jitter(0.3, campaign.name, label, 'mix'),
  );
  return apportion(campaignVisitors(campaign, siteQuery), weights);
}

function breakdown(
  campaign: DemoCampaign,
  items: WeightedLabels,
  siteQuery: BASiteQuery,
): Array<{ label: string } & RawMetrics> {
  const { period } = resolvePeriod(siteQuery);
  const visitors = splitVisitors(campaign, items, siteQuery);
  return items
    .map(([label], index) => {
      const quality = jitter(0.15, campaign.name, label) * periodQuality(campaign, period, label);
      return { label, ...toRawMetrics(campaign, visitors[index], quality) };
    })
    .filter((row) => row.total_visitors > 0)
    .sort((a, b) => b.total_visitors - a.total_visitors);
}

function findCampaign(campaignName?: string): DemoCampaign[] {
  return campaignName ? DEMO_CAMPAIGNS.filter((campaign) => campaign.name === campaignName) : DEMO_CAMPAIGNS;
}

function rankedCampaigns(siteQuery: BASiteQuery): RawCampaignData[] {
  return DEMO_CAMPAIGNS.map((campaign) => ({
    utm_campaign_name: campaign.name,
    ...campaignMetrics(campaign, siteQuery),
  })).sort(
    (a, b) =>
      b.total_visitors - a.total_visitors ||
      b.total_sessions - a.total_sessions ||
      a.utm_campaign_name.localeCompare(b.utm_campaign_name),
  );
}

function hourWeight(campaign: DemoCampaign, hourStartMs: number): number {
  const date = new Date(hourStartMs);
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6 ? 0.7 : 1;
  return (
    UTC_HOUR_WEIGHTS[date.getUTCHours()] *
    weekend *
    jitter(0.35, campaign.name, 'day', Math.floor(hourStartMs / DAY_MS)) *
    jitter(0.3, campaign.name, 'hour', hourStartMs)
  );
}

function bucketWeight(campaign: DemoCampaign, startMs: number, endMs: number, subHour: boolean): number {
  let weight = 0;
  for (let hourMs = Math.floor(startMs / HOUR_MS) * HOUR_MS; hourMs < endMs; hourMs += HOUR_MS) {
    const overlapMs = Math.min(hourMs + HOUR_MS, endMs) - Math.max(hourMs, startMs);
    weight += (hourWeight(campaign, hourMs) * overlapMs) / HOUR_MS;
  }
  return subHour ? weight * jitter(0.4, campaign.name, 'bucket', startMs) : weight;
}

// Bucket starts as ClickHouse's toStartOfInterval in the query timezone would produce them
function bucketStarts(siteQuery: BASiteQuery): moment.Moment[] {
  const step = BUCKET_STEP[siteQuery.granularity] ?? BUCKET_STEP.hour;
  const cursor = moment.tz(siteQuery.startDate, siteQuery.timezone);
  if (step.unit === 'minutes') {
    cursor.startOf('minute').subtract(cursor.minute() % step.amount, 'minutes');
  } else {
    cursor.startOf(step.unit === 'day' ? 'day' : 'hour');
  }
  const starts: moment.Moment[] = [];
  while (cursor.valueOf() <= siteQuery.endDate.getTime()) {
    starts.push(cursor.clone());
    cursor.add(step.amount, step.unit);
  }
  return starts;
}

export const demoCampaignDataSource = {
  async getCampaignCount(siteQuery: BASiteQuery): Promise<number> {
    return rankedCampaigns(siteQuery).length;
  },

  async getCampaignPerformancePageData(
    siteQuery: BASiteQuery,
    limit: number,
    offset: number,
  ): Promise<RawCampaignData[]> {
    return rankedCampaigns(siteQuery).slice(offset, offset + limit);
  },

  async getCampaignUTMBreakdownData(
    siteQuery: BASiteQuery,
    dimension: UTMDimension,
    campaignName?: string,
  ): Promise<RawCampaignUTMBreakdownItem[]> {
    return findCampaign(campaignName).flatMap((campaign) =>
      breakdown(campaign, campaign[UTM_DIMENSION_FIELD[dimension]], siteQuery),
    );
  },

  async getCampaignLandingPagePerformanceData(
    siteQuery: BASiteQuery,
    campaignName?: string,
  ): Promise<RawCampaignLandingPagePerformanceItem[]> {
    return findCampaign(campaignName).flatMap((campaign) =>
      breakdown(campaign, campaign.entryPages, siteQuery).map(({ label, ...metrics }) => ({
        utm_campaign_name: campaign.name,
        landing_page_url: label,
        ...metrics,
      })),
    );
  },

  async getCampaignVisitorTrendData(siteQuery: BASiteQuery, campaignNames: string[]): Promise<CampaignTrendRow[]> {
    const starts = bucketStarts(siteQuery);
    const step = BUCKET_STEP[siteQuery.granularity] ?? BUCKET_STEP.hour;
    const subHour = step.unit === 'minutes';

    return DEMO_CAMPAIGNS.filter((campaign) => campaignNames.includes(campaign.name)).flatMap((campaign) => {
      const weights = starts.map((start) =>
        bucketWeight(campaign, start.valueOf(), start.clone().add(step.amount, step.unit).valueOf(), subHour),
      );
      const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
      const total = campaignVisitors(campaign, siteQuery) * BUCKET_OVERLAP;
      const lastIndex = starts.length - 1;
      return (
        starts
          .map((start, index) => {
            const expected = weightSum > 0 ? (total * weights[index]) / weightSum : 0;
            // Dithered rounding keeps low-traffic buckets uneven, like real visits, instead of a flat run of ones
            const visitors = Math.floor(expected + hashToUnit(campaign.name, 'round', start.valueOf()));
            return {
              date: toDateTimeString(start.toDate()),
              utm_campaign: campaign.name,
              visitors: index === lastIndex ? Math.max(1, visitors) : visitors,
            };
          })
          // Like the real query, empty buckets carry no campaign; the last one always stays so the line reaches now
          .filter((row) => row.visitors > 0)
      );
    });
  },

  async getCampaignAudienceProfileData(
    siteQuery: BASiteQuery,
    campaignName: string | undefined,
    limitPerDimension: number,
  ): Promise<CampaignAudienceProfileRow[]> {
    return findCampaign(campaignName).flatMap((campaign) =>
      Object.entries(AUDIENCE_DIMENSION_FIELD).flatMap(([dimension, field]) => {
        const items = campaign[field];
        const visitors = splitVisitors(campaign, items, siteQuery);
        return items
          .map(([label], index) => ({
            dimension: dimension as CampaignAudienceProfileRow['dimension'],
            label,
            visitors: visitors[index],
          }))
          .filter((row) => row.visitors > 0)
          .sort((a, b) => b.visitors - a.visitors)
          .slice(0, limitPerDimension);
      }),
    );
  },
} satisfies Pick<
  typeof campaignRepository,
  | 'getCampaignCount'
  | 'getCampaignPerformancePageData'
  | 'getCampaignUTMBreakdownData'
  | 'getCampaignLandingPagePerformanceData'
  | 'getCampaignVisitorTrendData'
  | 'getCampaignAudienceProfileData'
>;
