import { clickhouse } from '@/lib/clickhouse';
import { DateTimeString } from '@/types/dates';
import {
  RawCampaignData,
  RawCampaignDataArraySchema,
  CampaignTrendRow,
  CampaignTrendRowArraySchema,
  RawCampaignSourceBreakdownItem,
  RawCampaignSourceBreakdownArraySchema,
  RawCampaignMediumBreakdownItem,
  RawCampaignMediumBreakdownArraySchema,
  RawCampaignContentBreakdownItem,
  RawCampaignContentBreakdownArraySchema,
  RawCampaignTermBreakdownItem,
  RawCampaignTermBreakdownArraySchema,
  RawCampaignLandingPagePerformanceItem,
  RawCampaignLandingPagePerformanceArraySchema,
} from '@/entities/campaign';
import { safeSql, SQL } from '@/lib/safe-sql';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { BAQuery } from '@/lib/ba-query';

const UTM_DIMENSION_ALIASES = {
  utm_campaign: 'utm_campaign_name',
  utm_source: 'source',
  utm_medium: 'medium',
  utm_content: 'content',
  utm_term: 'term',
} as const;

type ValidUTMDimension = keyof typeof UTM_DIMENSION_ALIASES;

async function getCampaignBreakdownByUTMDimension(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  utmDimension: ValidUTMDimension,
): Promise<unknown[]> {
  const dimensionAlias = UTM_DIMENSION_ALIASES[utmDimension];

  const query = safeSql`
    SELECT
      s.${SQL.Unsafe(utmDimension)} AS ${SQL.Unsafe(dimensionAlias)},
      COUNT(DISTINCT s.visitor_id) AS total_visitors,
      COUNT(DISTINCT IF(s.session_pageviews = 1, s.session_id, NULL)) AS bounced_sessions,
      COUNT(DISTINCT s.session_id) AS total_sessions,
      SUM(s.session_pageviews) AS total_pageviews,
      SUM(s.session_duration_seconds) AS sum_session_duration_seconds
    FROM (
      SELECT
        visitor_id,
        session_id,
        ${SQL.Unsafe(utmDimension)},
        dateDiff('second', MIN(timestamp), MAX(timestamp)) AS session_duration_seconds,
        COUNT(*) AS session_pageviews
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
        AND event_type = 1
        AND utm_campaign != ''
        AND ${SQL.Unsafe(utmDimension)} != ''
      GROUP BY visitor_id, session_id, ${SQL.Unsafe(utmDimension)}
    ) s
    GROUP BY s.${SQL.Unsafe(utmDimension)}
    ORDER BY total_visitors DESC
  `;

  const resultSet = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        siteId: siteId,
        startDate: startDate,
        endDate: endDate,
      },
    })
    .toPromise();

  return resultSet;
}

export async function getCampaignPerformanceData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<RawCampaignData[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_campaign');
  return RawCampaignDataArraySchema.parse(rawData);
}

export async function getCampaignSourceBreakdownData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<RawCampaignSourceBreakdownItem[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_source');
  return RawCampaignSourceBreakdownArraySchema.parse(rawData);
}

export async function getCampaignMediumBreakdownData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<RawCampaignMediumBreakdownItem[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_medium');
  return RawCampaignMediumBreakdownArraySchema.parse(rawData);
}

export async function getCampaignContentBreakdownData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<RawCampaignContentBreakdownItem[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_content');
  return RawCampaignContentBreakdownArraySchema.parse(rawData);
}

export async function getCampaignTermBreakdownData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<RawCampaignTermBreakdownItem[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_term');
  return RawCampaignTermBreakdownArraySchema.parse(rawData);
}

export async function getCampaignLandingPagePerformanceData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
): Promise<RawCampaignLandingPagePerformanceItem[]> {
  const query = safeSql`
    SELECT
        s.utm_campaign AS utm_campaign_name,
        s.landing_page_url,
        COUNT(DISTINCT s.visitor_id) AS total_visitors,
        COUNT(DISTINCT IF(s.session_total_pageviews = 1, s.session_id, NULL)) AS bounced_sessions,
        COUNT(DISTINCT s.session_id) AS total_sessions,
        SUM(s.session_total_pageviews) AS total_pageviews,
        SUM(s.session_total_duration_seconds) AS sum_session_duration_seconds
    FROM (
        SELECT
            e.visitor_id,
            e.session_id,
            e.utm_campaign,
            FIRST_VALUE(e.url) OVER (PARTITION BY e.session_id ORDER BY e.timestamp ASC) as landing_page_url,
            COUNT(e.url) OVER (PARTITION BY e.session_id) as session_total_pageviews,
            dateDiff('second', MIN(e.timestamp) OVER (PARTITION BY e.session_id), MAX(e.timestamp) OVER (PARTITION BY e.session_id)) as session_total_duration_seconds,
            ROW_NUMBER() OVER (PARTITION BY e.session_id ORDER BY e.timestamp ASC) as rn
        FROM analytics.events e
        WHERE e.site_id = {siteId:String}
          AND e.timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
          AND e.event_type = 1
          AND e.utm_campaign != ''
    ) s
    WHERE s.rn = 1
    GROUP BY s.utm_campaign, s.landing_page_url
    ORDER BY s.utm_campaign ASC, total_visitors DESC
  `;

  const resultSet = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        siteId: siteId,
        startDate: startDate,
        endDate: endDate,
      },
    })
    .toPromise();

  return RawCampaignLandingPagePerformanceArraySchema.parse(resultSet);
}

export async function getCampaignVisitorTrendData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  granularity: GranularityRangeValues,
  timezone: string,
): Promise<CampaignTrendRow[]> {
  const granularityFunc = BAQuery.getGranularitySQLFunctionFromGranularityRange(granularity, timezone);

  const query = safeSql`
    SELECT
      ${granularityFunc('timestamp')} AS date,
      utm_campaign,
      COUNT(DISTINCT visitor_id) AS visitors
    FROM analytics.events
    WHERE site_id = {siteId:String}
      AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
      AND utm_campaign != ''
    GROUP BY date, utm_campaign
    ORDER BY date ASC, utm_campaign ASC
  `;

  const resultSet = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        siteId: siteId,
        startDate: startDate,
        endDate: endDate,
      },
    })
    .toPromise();

  return CampaignTrendRowArraySchema.parse(resultSet);
}
