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
import {
  DeviceType,
  DeviceTypeSchema,
  BrowserInfo,
  BrowserInfoSchema,
  OperatingSystemInfo,
  OperatingSystemInfoSchema,
} from '@/entities/devices';
import { GeoVisitor, GeoVisitorSchema } from '@/entities/geography';
import { safeSql, SQL } from '@/lib/safe-sql';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { BAQuery } from '@/lib/ba-query';
import { z } from 'zod';

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
  campaignName?: string,
): Promise<unknown[]> {
  const dimensionAlias = UTM_DIMENSION_ALIASES[utmDimension];
  const campaignFilter = campaignName ? safeSql`AND utm_campaign = ${SQL.String({ campaignName })}` : safeSql``;

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
        ${campaignFilter}
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
  campaignName?: string,
): Promise<RawCampaignSourceBreakdownItem[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_source', campaignName);
  return RawCampaignSourceBreakdownArraySchema.parse(rawData);
}

export async function getCampaignMediumBreakdownData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  campaignName?: string,
): Promise<RawCampaignMediumBreakdownItem[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_medium', campaignName);
  return RawCampaignMediumBreakdownArraySchema.parse(rawData);
}

export async function getCampaignContentBreakdownData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  campaignName?: string,
): Promise<RawCampaignContentBreakdownItem[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(
    siteId,
    startDate,
    endDate,
    'utm_content',
    campaignName,
  );
  return RawCampaignContentBreakdownArraySchema.parse(rawData);
}

export async function getCampaignTermBreakdownData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  campaignName?: string,
): Promise<RawCampaignTermBreakdownItem[]> {
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_term', campaignName);
  return RawCampaignTermBreakdownArraySchema.parse(rawData);
}

export async function getCampaignLandingPagePerformanceData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  campaignName?: string,
): Promise<RawCampaignLandingPagePerformanceItem[]> {
  const campaignFilter = campaignName ? safeSql`AND e.utm_campaign = ${SQL.String({ campaignName })}` : safeSql``;

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
            FIRST_VALUE(e.url) OVER (PARTITION BY e.session_id, e.utm_campaign ORDER BY e.timestamp ASC) as landing_page_url,
            COUNT(e.url) OVER (PARTITION BY e.session_id) as session_total_pageviews,
            dateDiff('second', MIN(e.timestamp) OVER (PARTITION BY e.session_id), MAX(e.timestamp) OVER (PARTITION BY e.session_id)) as session_total_duration_seconds,
            ROW_NUMBER() OVER (PARTITION BY e.session_id, e.utm_campaign ORDER BY e.timestamp ASC) as rn
        FROM analytics.events e
        WHERE e.site_id = {siteId:String}
          AND e.timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
          AND e.event_type = 1
          AND e.utm_campaign != ''
          ${campaignFilter}
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
  campaignNames: string[],
): Promise<CampaignTrendRow[]> {
  if (campaignNames.length === 0) {
    return [];
  }

  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDate,
    endDate,
  );

  const campaignFilter = safeSql`AND utm_campaign IN (${SQL.SEPARATOR(
    campaignNames.map((name, index) => SQL.String({ [`campaign_${index}`]: name })),
  )})`;

  const query = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('timestamp')} AS date,
        utm_campaign,
        COUNT(DISTINCT visitor_id) AS visitors
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND ${range}
        ${campaignFilter}
      GROUP BY date, utm_campaign
      ORDER BY date ASC ${fill}, utm_campaign ASC
    `,
  );

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

const AudienceDimensionSchema = z.enum(['device', 'country', 'browser', 'os']);

const CampaignAudienceProfileRowSchema = z.object({
  dimension: AudienceDimensionSchema,
  label: z.string(),
  visitors: z.number(),
});

type CampaignAudienceProfileRow = z.infer<typeof CampaignAudienceProfileRowSchema>;

export async function getCampaignAudienceProfileData(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  campaignName?: string,
): Promise<CampaignAudienceProfileRow[]> {
  const campaignFilter = campaignName ? safeSql`AND utm_campaign = ${SQL.String({ campaignName })}` : safeSql``;

  const query = safeSql`
    SELECT dimension, label, visitors
    FROM (
      SELECT
        'device' AS dimension,
        device_type AS label,
        uniq(visitor_id) AS visitors
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
        AND event_type = 1
        AND utm_campaign != ''
        AND device_type != ''
        ${campaignFilter}
      GROUP BY device_type

      UNION ALL

      SELECT
        'country' AS dimension,
        country_code AS label,
        uniq(visitor_id) AS visitors
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
        AND country_code IS NOT NULL
        AND country_code != ''
        AND utm_campaign != ''
        ${campaignFilter}
      GROUP BY country_code

      UNION ALL

      SELECT
        'browser' AS dimension,
        browser AS label,
        uniq(visitor_id) AS visitors
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
        AND event_type = 1
        AND utm_campaign != ''
        AND browser != ''
        ${campaignFilter}
      GROUP BY browser

      UNION ALL

      SELECT
        'os' AS dimension,
        os AS label,
        uniq(visitor_id) AS visitors
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
        AND event_type = 1
        AND utm_campaign != ''
        AND os != ''
        ${campaignFilter}
      GROUP BY os
    )
    ORDER BY dimension ASC, visitors DESC
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        siteId,
        startDate,
        endDate,
      },
    })
    .toPromise();

  return CampaignAudienceProfileRowSchema.array().parse(
    (result as Array<{ dimension: string; label: string; visitors: number }>).map((row) => ({
      ...row,
      visitors: Number(row.visitors),
    })),
  );
}
