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
      ${SQL.Unsafe(utmDimension)} AS ${SQL.Unsafe(dimensionAlias)},
      COUNT(DISTINCT visitor_id) AS total_visitors,
      COUNT(DISTINCT IF(pageview_count = 1, session_id, NULL)) AS bounced_sessions,
      COUNT(DISTINCT session_id) AS total_sessions,
      SUM(pageview_count) AS total_pageviews,
      SUM(dateDiff('second', session_start, session_end)) AS sum_session_duration_seconds
    FROM analytics.sessions FINAL
    WHERE site_id = {siteId:String}
      AND session_start BETWEEN {startDate:DateTime} AND {endDate:DateTime}
      AND utm_campaign != ''
      AND ${SQL.Unsafe(utmDimension)} != ''
      ${campaignFilter}
    GROUP BY ${SQL.Unsafe(utmDimension)}
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
  const { siteId, startDateTime, endDateTime } = siteQuery;
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDateTime, endDateTime, 'utm_campaign');
  return RawCampaignDataArraySchema.parse(rawData);
}

export async function getCampaignCount(siteQuery: BASiteQuery): Promise<number> {
  const { siteId, startDateTime, endDateTime } = siteQuery;
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
        startDate: startDateTime,
        endDate: endDateTime,
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
  const { siteId, startDateTime, endDateTime } = siteQuery;
  const query = safeSql`
    SELECT
      utm_campaign AS utm_campaign_name,
      COUNT(DISTINCT visitor_id) AS total_visitors,
      COUNT(DISTINCT IF(pageview_count = 1, session_id, NULL)) AS bounced_sessions,
      COUNT(DISTINCT session_id) AS total_sessions,
      SUM(pageview_count) AS total_pageviews,
      SUM(dateDiff('second', session_start, session_end)) AS sum_session_duration_seconds
    FROM analytics.sessions FINAL
    WHERE site_id = {siteId:String}
      AND session_start BETWEEN {startDate:DateTime} AND {endDate:DateTime}
      AND utm_campaign != ''
    GROUP BY utm_campaign
    ORDER BY total_visitors DESC, total_sessions DESC, utm_campaign ASC
    LIMIT {limit:UInt32} OFFSET {offset:UInt32}
  `;

  const resultSet = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        siteId,
        startDate: startDateTime,
        endDate: endDateTime,
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
  const { siteId, startDateTime, endDateTime } = siteQuery;
  const utmKey = UTM_DIMENSION_TO_KEY[dimension] as ValidUTMDimension;
  const rawData = await getCampaignBreakdownByUTMDimension(siteId, startDateTime, endDateTime, utmKey, campaignName);
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
  const { siteId, startDateTime, endDateTime } = siteQuery;
  const campaignFilter = campaignName ? safeSql`AND utm_campaign = ${SQL.String({ campaignName })}` : safeSql``;

  const query = safeSql`
    WITH landing_pages AS (
      SELECT
        session_id,
        argMin(url, timestamp) as landing_page_url
      FROM analytics.events
      WHERE site_id = {siteId:String}
        AND timestamp BETWEEN {startDate:DateTime} AND {endDate:DateTime}
        AND event_type = 'pageview'
        AND utm_campaign != ''
        ${campaignFilter}
      GROUP BY session_id
    )
    SELECT
      s.utm_campaign AS utm_campaign_name,
      lp.landing_page_url,
      COUNT(DISTINCT s.visitor_id) AS total_visitors,
      COUNT(DISTINCT IF(s.pageview_count = 1, s.session_id, NULL)) AS bounced_sessions,
      COUNT(DISTINCT s.session_id) AS total_sessions,
      SUM(s.pageview_count) AS total_pageviews,
      SUM(dateDiff('second', s.session_start, s.session_end)) AS sum_session_duration_seconds
    FROM analytics.sessions AS s FINAL
    INNER JOIN landing_pages lp ON s.session_id = lp.session_id
    WHERE s.site_id = {siteId:String}
      AND s.session_start BETWEEN {startDate:DateTime} AND {endDate:DateTime}
      AND s.utm_campaign != ''
      ${campaignFilter}
    GROUP BY s.utm_campaign, lp.landing_page_url
    ORDER BY s.utm_campaign ASC, total_visitors DESC
  `;

  const resultSet = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        siteId: siteId,
        startDate: startDateTime,
        endDate: endDateTime,
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

  const { siteId, granularity, timezone, startDateTime, endDateTime } = siteQuery;

  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
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
        startDate: startDateTime,
        endDate: endDateTime,
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
  const { siteId, startDateTime, endDateTime } = siteQuery;
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
        startDate: startDateTime,
        endDate: endDateTime,
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
