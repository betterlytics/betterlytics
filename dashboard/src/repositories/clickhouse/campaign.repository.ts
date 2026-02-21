import { clickhouse } from '@/lib/clickhouse';
import {
  RawCampaignData,
  RawCampaignDataArraySchema,
  CampaignTrendRow,
  CampaignTrendRowArraySchema,
  RawCampaignUTMBreakdownItem,
  RawCampaignUTMBreakdownArraySchema,
  RawCampaignLandingPagePerformanceItem,
  RawCampaignLandingPagePerformanceArraySchema,
  type UTMDimension,
  UTM_DIMENSION_TO_KEY,
} from '@/entities/analytics/campaign.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { z } from 'zod';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

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
  startDate: string,
  endDate: string,
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
        AND event_type = 'pageview'
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

export async function getCampaignPerformanceData(siteQuery: BASiteQuery): Promise<RawCampaignData[]> {
  const { siteId } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, 'utm_campaign');
  return RawCampaignDataArraySchema.parse(rawData);
}

export async function getCampaignCount(siteQuery: BASiteQuery): Promise<number> {
  const { siteId } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
  const query = safeSql`
    SELECT
      COUNT(DISTINCT utm_campaign) AS total_campaigns
    FROM analytics.events
    WHERE site_id = {siteId:String}
      AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
      AND event_type = 'pageview'
      AND utm_campaign != ''
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

  if (!Array.isArray(result) || result.length === 0) {
    return 0;
  }

  const row = result[0] as { total_campaigns: number | string };
  return typeof row.total_campaigns === 'string' ? Number(row.total_campaigns) : row.total_campaigns;
}

export async function getCampaignPerformancePageData(
  siteQuery: BASiteQuery,
  limit: number,
  offset: number,
): Promise<RawCampaignData[]> {
  const { siteId } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
  const query = safeSql`
    SELECT
      s.utm_campaign AS utm_campaign_name,
      COUNT(DISTINCT s.visitor_id) AS total_visitors,
      COUNT(DISTINCT IF(s.session_pageviews = 1, s.session_id, NULL)) AS bounced_sessions,
      COUNT(DISTINCT s.session_id) AS total_sessions,
      SUM(s.session_pageviews) AS total_pageviews,
      SUM(s.session_duration_seconds) AS sum_session_duration_seconds
    FROM (
      SELECT
        visitor_id,
        session_id,
        utm_campaign,
        dateDiff('second', MIN(timestamp), MAX(timestamp)) AS session_duration_seconds,
        COUNT(*) AS session_pageviews
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
        AND event_type = 'pageview'
        AND utm_campaign != ''
      GROUP BY visitor_id, session_id, utm_campaign
    ) s
    GROUP BY s.utm_campaign
    ORDER BY total_visitors DESC, total_sessions DESC, s.utm_campaign ASC
    LIMIT {limit:UInt32} OFFSET {offset:UInt32}
  `;

  const resultSet = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        siteId,
        startDate,
        endDate,
        limit,
        offset,
      },
    })
    .toPromise();

  return RawCampaignDataArraySchema.parse(resultSet);
}

export async function getCampaignUTMBreakdownData(
  siteQuery: BASiteQuery,
  dimension: UTMDimension,
  campaignName?: string,
): Promise<RawCampaignUTMBreakdownItem[]> {
  const { siteId } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
  const utmKey = UTM_DIMENSION_TO_KEY[dimension] as ValidUTMDimension;
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDate, endDate, utmKey, campaignName);
  return RawCampaignUTMBreakdownArraySchema.parse(
    rawData.map((row) => ({
      ...(row as RawCampaignUTMBreakdownItem),
      label: (row as Record<string, unknown>)[UTM_DIMENSION_ALIASES[utmKey]],
    })),
  );
}

export async function getCampaignLandingPagePerformanceData(
  siteQuery: BASiteQuery,
  campaignName?: string,
): Promise<RawCampaignLandingPagePerformanceItem[]> {
  const { siteId } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
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
          AND e.event_type = 'pageview'
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
  siteQuery: BASiteQuery,
  campaignNames: string[],
): Promise<CampaignTrendRow[]> {
  if (campaignNames.length === 0) {
    return [];
  }

  const { siteId, granularity, timezone } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;

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
  siteQuery: BASiteQuery,
  campaignName: string | undefined,
  limitPerDimension: number,
): Promise<CampaignAudienceProfileRow[]> {
  const { siteId } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;
  const campaignFilter = campaignName ? safeSql`AND utm_campaign = ${SQL.String({ campaignName })}` : safeSql``;

  const query = safeSql`
    SELECT
      dim.1 AS dimension,
      dim.2 AS label,
      uniq(visitor_id) AS visitors
    FROM
    (
      SELECT
        visitor_id,
        [
          ('device', device_type),
          ('country', country_code),
          ('browser', browser),
          ('os', os)
        ] AS dims
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
        AND utm_campaign != ''
        ${campaignFilter}
    ) AS s
    ARRAY JOIN dims AS dim
    WHERE dim.2 != '' AND dim.2 IS NOT NULL
    GROUP BY dimension, label
    ORDER BY dimension ASC, visitors DESC
    LIMIT {limitPerDimension:UInt32} BY dimension
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        siteId,
        startDate,
        endDate,
        limitPerDimension,
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
