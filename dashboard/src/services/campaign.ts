'server-only';

import {
  getCampaignPerformanceData,
  getCampaignSourceBreakdownData,
  getCampaignVisitorTrendData,
  getCampaignMediumBreakdownData,
  getCampaignContentBreakdownData,
  getCampaignTermBreakdownData,
  getCampaignLandingPagePerformanceData,
  getCampaignAudienceProfileData,
} from '@/repositories/clickhouse/campaign';
import {
  CampaignPerformance,
  CampaignPerformanceArraySchema,
  CampaignSourceBreakdownItem,
  CampaignSourceBreakdownArraySchema,
  RawCampaignData,
  RawCampaignSourceBreakdownItem,
  CampaignTrendRow,
  CampaignMediumBreakdownItem,
  CampaignMediumBreakdownArraySchema,
  RawCampaignMediumBreakdownItem,
  RawCampaignContentBreakdownItem,
  CampaignContentBreakdownItem,
  CampaignContentBreakdownArraySchema,
  RawCampaignTermBreakdownItem,
  CampaignTermBreakdownItem,
  CampaignTermBreakdownArraySchema,
  RawCampaignLandingPagePerformanceItem,
  CampaignLandingPagePerformanceItem,
  CampaignLandingPagePerformanceArraySchema,
  CampaignSparklinePoint,
} from '@/entities/campaign';
import {
  BrowserInfoSchema,
  DeviceTypeSchema,
  OperatingSystemInfoSchema,
  type BrowserInfo,
  type DeviceType,
  type OperatingSystemInfo,
} from '@/entities/devices';
import { GeoVisitorSchema, type GeoVisitor } from '@/entities/geography';
import { toDateTimeString } from '@/utils/dateFormatters';
import { formatDuration } from '@/utils/dateFormatters';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { toSparklineSeries } from '@/presenters/toAreaChart';

interface RawMetricsData {
  total_sessions: number;
  bounced_sessions: number;
  sum_session_duration_seconds: number;
  total_pageviews: number;
}

interface CalculatedMetrics {
  bounceRate: number;
  avgSessionDuration: string;
  pagesPerSession: number;
}

function calculateCommonCampaignMetrics(rawData: RawMetricsData): CalculatedMetrics {
  const bounceRate = rawData.total_sessions > 0 ? (rawData.bounced_sessions / rawData.total_sessions) * 100 : 0;
  const avgSessionDurationSeconds =
    rawData.total_sessions > 0 ? rawData.sum_session_duration_seconds / rawData.total_sessions : 0;
  const pagesPerSession = rawData.total_sessions > 0 ? rawData.total_pageviews / rawData.total_sessions : 0;
  const avgSessionDurationFormatted = formatDuration(avgSessionDurationSeconds);

  return {
    bounceRate: parseFloat(bounceRate.toFixed(1)),
    avgSessionDuration: avgSessionDurationFormatted,
    pagesPerSession: parseFloat(pagesPerSession.toFixed(1)),
  };
}

export async function fetchCampaignPerformance(
  siteId: string,
  startDate: Date,
  endDate: Date,
): Promise<CampaignPerformance[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawCampaignData: RawCampaignData[] = await getCampaignPerformanceData(siteId, startDateTime, endDateTime);

  const transformedData: CampaignPerformance[] = rawCampaignData.map((raw: RawCampaignData) => {
    const metrics = calculateCommonCampaignMetrics(raw);
    return {
      name: raw.utm_campaign_name,
      visitors: raw.total_visitors,
      ...metrics,
    };
  });

  return CampaignPerformanceArraySchema.parse(transformedData);
}

export async function fetchCampaignSourceBreakdown(
  siteId: string,
  startDate: Date,
  endDate: Date,
  campaignName?: string,
): Promise<CampaignSourceBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawSourceData: RawCampaignSourceBreakdownItem[] = await getCampaignSourceBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
    campaignName,
  );

  const transformedData: CampaignSourceBreakdownItem[] = rawSourceData.map(
    (raw: RawCampaignSourceBreakdownItem) => {
      const metrics = calculateCommonCampaignMetrics(raw);
      return {
        source: raw.source,
        visitors: raw.total_visitors,
        ...metrics,
      };
    },
  );

  return CampaignSourceBreakdownArraySchema.parse(transformedData);
}

export async function fetchCampaignMediumBreakdown(
  siteId: string,
  startDate: Date,
  endDate: Date,
  campaignName?: string,
): Promise<CampaignMediumBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawMediumData: RawCampaignMediumBreakdownItem[] = await getCampaignMediumBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
    campaignName,
  );

  const transformedData: CampaignMediumBreakdownItem[] = rawMediumData.map(
    (raw: RawCampaignMediumBreakdownItem) => {
      const metrics = calculateCommonCampaignMetrics(raw);
      return {
        medium: raw.medium,
        visitors: raw.total_visitors,
        ...metrics,
      };
    },
  );

  return CampaignMediumBreakdownArraySchema.parse(transformedData);
}

export async function fetchCampaignContentBreakdown(
  siteId: string,
  startDate: Date,
  endDate: Date,
  campaignName?: string,
): Promise<CampaignContentBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawContentData: RawCampaignContentBreakdownItem[] = await getCampaignContentBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
    campaignName,
  );

  const transformedData: CampaignContentBreakdownItem[] = rawContentData.map(
    (raw: RawCampaignContentBreakdownItem) => {
      const metrics = calculateCommonCampaignMetrics(raw);
      return {
        content: raw.content,
        visitors: raw.total_visitors,
        ...metrics,
      };
    },
  );

  return CampaignContentBreakdownArraySchema.parse(transformedData);
}

export async function fetchCampaignTermBreakdown(
  siteId: string,
  startDate: Date,
  endDate: Date,
  campaignName?: string,
): Promise<CampaignTermBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawTermData: RawCampaignTermBreakdownItem[] = await getCampaignTermBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
    campaignName,
  );

  const transformedData: CampaignTermBreakdownItem[] = rawTermData.map((raw: RawCampaignTermBreakdownItem) => {
    const metrics = calculateCommonCampaignMetrics(raw);
    return {
      term: raw.term,
      visitors: raw.total_visitors,
      ...metrics,
    };
  });

  return CampaignTermBreakdownArraySchema.parse(transformedData);
}

export async function fetchCampaignLandingPagePerformance(
  siteId: string,
  startDate: Date,
  endDate: Date,
  campaignName?: string,
): Promise<CampaignLandingPagePerformanceItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawLandingPageData: RawCampaignLandingPagePerformanceItem[] = await getCampaignLandingPagePerformanceData(
    siteId,
    startDateTime,
    endDateTime,
    campaignName,
  );

  const transformedData: CampaignLandingPagePerformanceItem[] = rawLandingPageData.map(
    (raw: RawCampaignLandingPagePerformanceItem) => {
      const metrics = calculateCommonCampaignMetrics(raw);
      return {
        campaignName: raw.utm_campaign_name,
        landingPageUrl: raw.landing_page_url,
        visitors: raw.total_visitors,
        ...metrics,
      };
    },
  );

  return CampaignLandingPagePerformanceArraySchema.parse(transformedData);
}

export async function fetchCampaignVisitorTrend(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  timezone: string,
  campaignNames: string[],
): Promise<CampaignTrendRow[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  return getCampaignVisitorTrendData(siteId, startDateTime, endDateTime, granularity, timezone, campaignNames);
}

const SPARKLINE_ALLOWED_GRANULARITIES: GranularityRangeValues[] = [
  'day',
  'hour',
  'minute_30',
  'minute_15',
  'minute_1',
];

function getSafeSparklineGranularity(granularity: GranularityRangeValues): GranularityRangeValues {
  return SPARKLINE_ALLOWED_GRANULARITIES.includes(granularity) ? granularity : 'hour';
}

export async function fetchCampaignSparklines(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  timezone: string,
  campaignNames: string[],
): Promise<Record<string, CampaignSparklinePoint[]>> {
  if (campaignNames.length === 0) {
    return {};
  }

  const safeGranularity = getSafeSparklineGranularity(granularity);
  const dateRange = { start: startDate, end: endDate };
  const trendRows = await fetchCampaignVisitorTrend(
    siteId,
    startDate,
    endDate,
    safeGranularity,
    timezone,
    campaignNames,
  );

  const campaignSet = new Set(campaignNames);
  const grouped = new Map<string, CampaignTrendRow[]>();
  campaignNames.forEach((name) => grouped.set(name, []));

  trendRows.forEach((row) => {
    if (!campaignSet.has(row.utm_campaign)) {
      return;
    }
    const bucket = grouped.get(row.utm_campaign) ?? [];
    bucket.push(row);
    grouped.set(row.utm_campaign, bucket);
  });

  const sparklineMap: Record<string, CampaignSparklinePoint[]> = {};
  grouped.forEach((rows, campaignName) => {
    if (rows.length === 0) {
      sparklineMap[campaignName] = [];
      return;
    }

    const sparkline = toSparklineSeries({
      data: rows.map((row) => ({
        date: row.date,
        visitors: row.visitors,
      })),
      granularity: safeGranularity,
      dataKey: 'visitors',
      dateRange,
    }) as Array<{ date: Date; visitors: number }>;

    sparklineMap[campaignName] = sparkline.map((point) => ({
      date: point.date.toISOString(),
      visitors: point.visitors,
    }));
  });

  return sparklineMap;
}

export type CampaignAudienceProfileData = {
  devices: DeviceType[];
  countries: GeoVisitor[];
  browsers: BrowserInfo[];
  operatingSystems: OperatingSystemInfo[];
};

export async function fetchCampaignAudienceProfile(
  siteId: string,
  startDate: Date,
  endDate: Date,
  campaignName?: string,
): Promise<CampaignAudienceProfileData> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const raw = await getCampaignAudienceProfileData(siteId, startDateTime, endDateTime, campaignName);

  const mapRows = <T>(dimension: string, mapper: (row: (typeof raw)[number]) => T): T[] =>
    raw.filter((row) => row.dimension === dimension).map(mapper);

  const devices = DeviceTypeSchema.array().parse(
    mapRows('device', (row) => ({
      device_type: row.label,
      visitors: row.visitors,
    })),
  );

  const countries = GeoVisitorSchema.array().parse(
    mapRows('country', (row) => ({
      country_code: row.label,
      visitors: row.visitors,
    })),
  );

  const browsers = BrowserInfoSchema.array().parse(
    mapRows('browser', (row) => ({
      browser: row.label,
      visitors: row.visitors,
    })),
  );

  const operatingSystems = OperatingSystemInfoSchema.array().parse(
    mapRows('os', (row) => ({
      os: row.label,
      visitors: row.visitors,
    })),
  );

  return {
    devices,
    countries,
    browsers,
    operatingSystems,
  };
}
