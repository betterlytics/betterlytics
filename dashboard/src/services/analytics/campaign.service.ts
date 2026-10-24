'server-only';

import * as campaignRepository from '@/repositories/clickhouse/campaign.repository';
import { demoCampaignDataSource } from '@/services/analytics/demoCampaigns.service';
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
  type UTMDimension,
} from '@/entities/analytics/campaign.entities';
import {
  BrowserInfoSchema,
  DeviceTypeSchema,
  OperatingSystemInfoSchema,
  type BrowserInfo,
  type DeviceType,
  type OperatingSystemInfo,
} from '@/entities/analytics/devices.entities';
import { GeoVisitorSchema, type GeoVisitor } from '@/entities/analytics/geography.entities';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { toSparklineSeries } from '@/presenters/toAreaChart';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';

// Public demo visitors on Cloud get the bundled example campaigns; self-hosted public dashboards keep their real data
function getCampaignDataSource(authContext: AuthContext) {
  return authContext.isDemo && isFeatureEnabled('isCloud') ? demoCampaignDataSource : campaignRepository;
}

interface RawMetricsData {
  total_sessions: number;
  bounced_sessions: number;
  sum_session_duration_seconds: number;
  total_pageviews: number;
}

interface CalculatedMetrics {
  bounceRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
}

function calculateCommonCampaignMetrics(rawData: RawMetricsData): CalculatedMetrics {
  const bounceRate = rawData.total_sessions > 0 ? (rawData.bounced_sessions / rawData.total_sessions) * 100 : 0;
  const avgSessionDurationSeconds =
    rawData.total_sessions > 0 ? rawData.sum_session_duration_seconds / rawData.total_sessions : 0;
  const pagesPerSession = rawData.total_sessions > 0 ? rawData.total_pageviews / rawData.total_sessions : 0;

  return {
    bounceRate: parseFloat(bounceRate.toFixed(1)),
    avgSessionDuration: avgSessionDurationSeconds,
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
  authContext: AuthContext,
  siteQuery: BASiteQuery,
  pageIndex: number,
  pageSize: number,
): Promise<CampaignPerformancePage> {
  const safePageSize = pageSize > 0 ? Math.min(pageSize, 100) : 10;
  const dataSource = getCampaignDataSource(authContext);
  const totalCampaigns = await dataSource.getCampaignCount(siteQuery);
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / safePageSize));
  const safePageIndex = Math.min(Math.max(pageIndex, 0), totalPages - 1);
  const offset = safePageIndex * safePageSize;

  const rawCampaignData: RawCampaignData[] = await dataSource.getCampaignPerformancePageData(
    siteQuery,
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
  hasEverHadCampaigns: boolean;
};

export async function fetchCampaignDirectoryPage(
  authContext: AuthContext,
  siteQuery: BASiteQuery,
  pageIndex: number,
  pageSize: number,
): Promise<CampaignDirectoryPage> {
  const performancePage = await fetchCampaignPerformancePage(authContext, siteQuery, pageIndex, pageSize);
  const campaignNames = performancePage.campaigns.map((campaign) => campaign.name);

  const sparklineMap =
    campaignNames.length > 0 ? await fetchCampaignSparklines(authContext, siteQuery, campaignNames) : {};

  const hasEverHadCampaigns =
    performancePage.totalCampaigns > 0 || (await campaignRepository.hasAnyCampaignData(siteQuery.siteId));

  const campaigns: CampaignListRowSummary[] = performancePage.campaigns.map((campaign) => ({
    ...campaign,
    sparkline: sparklineMap[campaign.name] ?? [],
  }));

  return {
    campaigns,
    totalCampaigns: performancePage.totalCampaigns,
    pageIndex: performancePage.pageIndex,
    pageSize: performancePage.pageSize,
    hasEverHadCampaigns,
  };
}

export async function fetchCampaignUTMBreakdown(
  authContext: AuthContext,
  siteQuery: BASiteQuery,
  dimension: UTMDimension,
  campaignName?: string,
): Promise<CampaignUTMBreakdownItem[]> {
  const dataSource = getCampaignDataSource(authContext);
  const rawData: RawCampaignUTMBreakdownItem[] = await dataSource.getCampaignUTMBreakdownData(
    siteQuery,
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
  authContext: AuthContext,
  siteQuery: BASiteQuery,
  campaignName?: string,
): Promise<CampaignLandingPagePerformanceItem[]> {
  const dataSource = getCampaignDataSource(authContext);
  const rawLandingPageData: RawCampaignLandingPagePerformanceItem[] =
    await dataSource.getCampaignLandingPagePerformanceData(siteQuery, campaignName);

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
  authContext: AuthContext,
  siteQuery: BASiteQuery,
  campaignNames: string[],
): Promise<Record<string, CampaignSparklinePoint[]>> {
  if (campaignNames.length === 0) {
    return {};
  }

  const safeGranularity = getSafeSparklineGranularity(siteQuery.granularity);
  const sparklineSiteQuery: BASiteQuery = { ...siteQuery, granularity: safeGranularity };

  const dataSource = getCampaignDataSource(authContext);
  const trendRows = await dataSource.getCampaignVisitorTrendData(sparklineSiteQuery, campaignNames);

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
      dateRange: { start: siteQuery.startDate, end: siteQuery.endDate },
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
  authContext: AuthContext,
  siteQuery: BASiteQuery,
  campaignName?: string,
): Promise<CampaignAudienceProfileData> {
  const AUDIENCE_DIMENSION_LIMIT = 3;

  const dataSource = getCampaignDataSource(authContext);
  const raw = await dataSource.getCampaignAudienceProfileData(siteQuery, campaignName, AUDIENCE_DIMENSION_LIMIT);

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
