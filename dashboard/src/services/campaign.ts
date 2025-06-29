'server-only';

import {
  getCampaignPerformanceData,
  getCampaignSourceBreakdownData,
  getCampaignVisitorTrendData,
  getCampaignMediumBreakdownData,
  getCampaignContentBreakdownData,
  getCampaignTermBreakdownData,
  getCampaignLandingPagePerformanceData,
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
} from '@/entities/campaign';
import { toDateTimeString } from '@/utils/dateFormatters';
import { formatDuration } from '@/utils/dateFormatters';
import { GranularityRangeValues } from '@/utils/granularityRanges';

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
): Promise<CampaignSourceBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawSourceData: RawCampaignSourceBreakdownItem[] = await getCampaignSourceBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
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
): Promise<CampaignMediumBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawMediumData: RawCampaignMediumBreakdownItem[] = await getCampaignMediumBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
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
): Promise<CampaignContentBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawContentData: RawCampaignContentBreakdownItem[] = await getCampaignContentBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
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
): Promise<CampaignTermBreakdownItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawTermData: RawCampaignTermBreakdownItem[] = await getCampaignTermBreakdownData(
    siteId,
    startDateTime,
    endDateTime,
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
): Promise<CampaignLandingPagePerformanceItem[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  const rawLandingPageData: RawCampaignLandingPagePerformanceItem[] = await getCampaignLandingPagePerformanceData(
    siteId,
    startDateTime,
    endDateTime,
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
): Promise<CampaignTrendRow[]> {
  const startDateTime = toDateTimeString(startDate);
  const endDateTime = toDateTimeString(endDate);

  return getCampaignVisitorTrendData(siteId, startDateTime, endDateTime, granularity);
}
