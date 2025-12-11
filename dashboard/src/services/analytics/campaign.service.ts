'server-only';

import {
  getCampaignVisitorTrendData,
  getCampaignLandingPagePerformanceData,
  getCampaignAudienceProfileData,
  getCampaignCount,
  getCampaignPerformancePageData,
  getCampaignPerformancePageDataCursor,
  getCampaignUTMBreakdownData,
} from '@/repositories/clickhouse/campaign.repository';
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
  CampaignListRowSummary,
  CampaignListRowSummarySchema,
  type UTMDimension,
  type CampaignSortConfig,
  CAMPAIGN_SORT_FIELD_TO_CURSOR_KEY,
} from '@/entities/analytics/campaign.entities';
import { decodeCursor, createCursorPaginatedResponse, LimitSchema } from '@/lib/cursor-pagination';
import type { CursorPaginatedResult } from '@/entities/pagination.entities';
import {
  BrowserInfoSchema,
  DeviceTypeSchema,
  OperatingSystemInfoSchema,
  type BrowserInfo,
  type DeviceType,
  type OperatingSystemInfo,
} from '@/entities/analytics/devices.entities';
import { GeoVisitorSchema, type GeoVisitor } from '@/entities/analytics/geography.entities';
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
  campaigns: CampaignListRowSummary[];
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

  const campaigns: CampaignListRowSummary[] = performancePage.campaigns.map((campaign) => ({
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

/**
 * Response type for cursor-based campaign directory pagination
 */
export type CampaignDirectoryPageCursor = CursorPaginatedResult<CampaignListRowSummary>;

/**
 * Fetch campaign directory page using cursor-based pagination.
 * Returns items with sparklines, nextCursor, and hasMore flag.
 *
 * @param siteId - Site ID
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param granularity - Granularity for sparklines
 * @param timezone - Timezone for date calculations
 * @param sortConfig - Sort configuration
 * @param encodedCursor - Base64-encoded cursor string (null for first page)
 * @param limit - Number of items to fetch
 */
export async function fetchCampaignDirectoryPageCursor(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  timezone: string,
  sortConfig: CampaignSortConfig,
  encodedCursor: string | null,
  limit: number,
): Promise<CampaignDirectoryPageCursor> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  // Validate and constrain limit
  const safeLimit = LimitSchema.parse(limit);

  // Decode cursor (returns null for invalid or missing cursor)
  const cursor = decodeCursor(encodedCursor);

  // Fetch raw campaign data with cursor pagination
  const rawCampaignData = await getCampaignPerformancePageDataCursor(
    siteId,
    startDateTime,
    endDateTime,
    sortConfig,
    cursor,
    safeLimit,
  );

  // Create cursor-paginated response (handles hasMore detection and cursor extraction)
  const paginatedRaw = createCursorPaginatedResponse(
    rawCampaignData,
    safeLimit,
    sortConfig,
    CAMPAIGN_SORT_FIELD_TO_CURSOR_KEY,
  );

  // Transform raw data to campaign performance format
  const transformedCampaigns: CampaignPerformance[] = paginatedRaw.items.map((raw) => {
    const metrics = calculateCommonCampaignMetrics(raw);
    return {
      name: raw.utm_campaign_name,
      visitors: raw.total_visitors,
      ...metrics,
    };
  });

  const campaignNames = transformedCampaigns.map((c) => c.name);

  // Fetch sparklines for the current page of campaigns
  const sparklineMap =
    campaignNames.length > 0
      ? await fetchCampaignSparklines(siteId, startDate, endDate, granularity, timezone, campaignNames)
      : {};

  // Combine performance data with sparklines
  const campaigns: CampaignListRowSummary[] = transformedCampaigns.map((campaign) =>
    CampaignListRowSummarySchema.parse({
      ...campaign,
      sparkline: sparklineMap[campaign.name] ?? [],
    }),
  );

  return {
    items: campaigns,
    nextCursor: paginatedRaw.nextCursor,
    hasMore: paginatedRaw.hasMore,
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

  const trendRows = await getCampaignVisitorTrendData(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    safeGranularity,
    timezone,
    campaignNames,
  );

  const grouped = trendRows.reduce<Record<string, CampaignTrendRow[]>>((acc, row) => {
    (acc[row.utm_campaign] ??= []).push(row);
    return acc;
  }, {});

  const sparklineMap: Record<string, CampaignSparklinePoint[]> = {};

  for (const campaignName of campaignNames) {
    const rows = grouped[campaignName];
    if (!rows || rows.length === 0) {
      sparklineMap[campaignName] = [];
      continue;
    }

    const sparkline = toSparklineSeries({
      data: rows.map((row) => ({
        date: row.date,
        visitors: row.visitors,
      })),
      granularity: safeGranularity,
      dataKey: 'visitors',
      dateRange: { start: startDate, end: endDate },
    }) as Array<{ date: Date; visitors: number }>;

    sparklineMap[campaignName] = sparkline.map((point) => ({
      date: point.date.toISOString(),
      visitors: point.visitors,
    }));
  }

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

const SPARKLINE_ALLOWED_GRANULARITIES: GranularityRangeValues[] = ['day', 'hour', 'minute_30', 'minute_15'];

function getSafeSparklineGranularity(granularity: GranularityRangeValues): GranularityRangeValues {
  return SPARKLINE_ALLOWED_GRANULARITIES.includes(granularity) ? granularity : 'hour';
}
