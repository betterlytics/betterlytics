'server-only';

import {
  getCampaignPerformanceData,
  getCampaignVisitorTrendData,
  getCampaignLandingPagePerformanceData,
  getCampaignAudienceProfileData,
  getCampaignCount,
  getCampaignPerformancePageData,
  getCampaignUTMBreakdownData,
} from '@/repositories/clickhouse/campaign';
import {
  CampaignPerformance,
  CampaignPerformanceArraySchema,
  CampaignUTMBreakdownItem,
  CampaignUTMBreakdownArraySchema,
  RawCampaignData,
  RawCampaignUTMBreakdownItem,
  CampaignTrendRow,
  RawCampaignLandingPagePerformanceItem,
  CampaignLandingPagePerformanceItem,
  CampaignLandingPagePerformanceArraySchema,
  CampaignSparklinePoint,
  CampaignDirectoryRowSummary,
  type UTMDimension,
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

export type CampaignPerformancePage = {
  campaigns: CampaignPerformance[];
  totalCampaigns: number;
  pageIndex: number;
  pageSize: number;
};

async function fetchCampaignPerformancePage(
  siteId: string,
  startDate: Date,
  endDate: Date,
  pageIndex: number,
  pageSize: number,
): Promise<CampaignPerformancePage> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const safePageSize = pageSize > 0 ? Math.min(pageSize, 100) : 10;
  const totalCampaigns = await getCampaignCount(siteId, startDateTime, endDateTime);
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / safePageSize));
  const safePageIndex = Math.min(Math.max(pageIndex, 0), totalPages - 1);
  const offset = safePageIndex * safePageSize;

  const rawCampaignData: RawCampaignData[] = await getCampaignPerformancePageData(
    siteId,
    startDateTime,
    endDateTime,
    safePageSize,
    offset,
  );

  const transformedData: CampaignPerformance[] = rawCampaignData.map((raw: RawCampaignData) => {
    const metrics = calculateCommonCampaignMetrics(raw);
    return {
      name: raw.utm_campaign_name,
      visitors: raw.total_visitors,
      ...metrics,
    };
  });

  const campaigns = CampaignPerformanceArraySchema.parse(transformedData);

  return {
    campaigns,
    totalCampaigns,
    pageIndex: safePageIndex,
    pageSize: safePageSize,
  };
}

export type CampaignDirectoryPage = {
  campaigns: CampaignDirectoryRowSummary[];
  totalCampaigns: number;
  pageIndex: number;
  pageSize: number;
};

export async function fetchCampaignDirectoryPage(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  timezone: string,
  pageIndex: number,
  pageSize: number,
): Promise<CampaignDirectoryPage> {
  const performancePage = await fetchCampaignPerformancePage(siteId, startDate, endDate, pageIndex, pageSize);
  const campaignNames = performancePage.campaigns.map((campaign) => campaign.name);

  const sparklineMap =
    campaignNames.length > 0
      ? await fetchCampaignSparklines(siteId, startDate, endDate, granularity, timezone, campaignNames)
      : {};

  const campaigns: CampaignDirectoryRowSummary[] = performancePage.campaigns.map((campaign) => ({
    ...campaign,
    sparkline: sparklineMap[campaign.name] ?? [],
  }));

  return {
    campaigns,
    totalCampaigns: performancePage.totalCampaigns,
    pageIndex: performancePage.pageIndex,
    pageSize: performancePage.pageSize,
  };
}

export async function fetchCampaignUTMBreakdown(
  siteId: string,
  startDate: Date,
  endDate: Date,
  dimension: UTMDimension,
  campaignName?: string,
): Promise<CampaignUTMBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawData: RawCampaignUTMBreakdownItem[] = await getCampaignUTMBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
    dimension,
    campaignName,
  );

  const transformedData: CampaignUTMBreakdownItem[] = rawData.map((raw) => {
    const metrics = calculateCommonCampaignMetrics(raw);
    return {
      label: raw.label,
      visitors: raw.total_visitors,
      ...metrics,
    };
  });

  return CampaignUTMBreakdownArraySchema.parse(transformedData);
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

  const AUDIENCE_DIMENSION_LIMIT = 3;

  const raw = await getCampaignAudienceProfileData(
    siteId,
    startDateTime,
    endDateTime,
    campaignName,
    AUDIENCE_DIMENSION_LIMIT,
  );

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
