import { clickhouse } from '@/lib/clickhouse';
import {
  HeatmapMetric,
  WeeklyHeatmapRow,
  WeeklyHeatmapRowSchema,
} from '@/entities/analytics/weeklyHeatmap.entities';
import { BAQuery } from '@/lib/ba-query';
import { BASessionQuery } from '@/lib/ba-session-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

function parseHeatmapRows(rows: any[]): WeeklyHeatmapRow[] {
  return rows.map((row) =>
    WeeklyHeatmapRowSchema.parse({
      weekday: Number(row.weekday),
      hour: Number(row.hour),
      value: Number(row.value),
    }),
  );
}

async function getSessionAggregateHeatmap(
  siteQuery: BASiteQuery,
  metric: 'bounce_rate' | 'pages_per_session' | 'session_duration',
): Promise<WeeklyHeatmapRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const timezone = siteQuery.timezone ?? 'UTC';

  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['session_start', 'session_end', 'pageview_count'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const tz = SQL.String({ tz: timezone });

  const valueExpr =
    metric === 'bounce_rate'
      ? safeSql`if(count() > 0, round((count() - countIf(pageview_count > 1)) / count() * 100, 1), 0)`
      : metric === 'pages_per_session'
        ? safeSql`if(count() > 0, round(avg(pageview_count), 1), 0)`
        : safeSql`if(countIf(pageview_count > 1) > 0, round(avgIf(dateDiff('second', session_start, session_end), pageview_count > 1), 0), 0)`;

  const query = safeSql`
    SELECT
      weekday,
      hour,
      ${valueExpr} as value
    FROM (
      SELECT
        toDayOfWeek(toTimeZone(session_start, ${tz})) as weekday,
        toHour(toTimeZone(session_start, ${tz})) as hour,
        pageview_count,
        session_start,
        session_end
      FROM ${sessionSubQuery}
    )
    GROUP BY weekday, hour
    ORDER BY weekday ASC, hour ASC
  `;

  const result = (await clickhouse.query(query.taggedSql, { params: query.taggedParams }).toPromise()) as any[];

  return parseHeatmapRows(result);
}

async function getSessionCountHeatmap(
  siteQuery: BASiteQuery,
  metric: 'sessions' | 'unique_visitors',
): Promise<WeeklyHeatmapRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const timezone = siteQuery.timezone ?? 'UTC';

  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    metric === 'unique_visitors' ? ['session_start', 'visitor_id'] : ['session_start'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const tz = SQL.String({ tz: timezone });

  const valueExpr =
    metric === 'sessions' ? safeSql`count() / uniq(week_start)` : safeSql`uniq(visitor_id) / uniq(week_start)`;

  const query = safeSql`
    WITH toStartOfWeek(toTimeZone(session_start, ${tz})) AS week_start
    SELECT
      toDayOfWeek(toTimeZone(session_start, ${tz})) as weekday,
      toHour(toTimeZone(session_start, ${tz})) as hour,
      ${valueExpr} as value
    FROM ${sessionSubQuery}
    GROUP BY weekday, hour
    ORDER BY weekday ASC, hour ASC
  `;

  const result = (await clickhouse.query(query.taggedSql, { params: query.taggedParams }).toPromise()) as any[];

  return parseHeatmapRows(result);
}

async function getPageviewHeatmap(siteQuery: BASiteQuery): Promise<WeeklyHeatmapRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const timezone = siteQuery.timezone ?? 'UTC';

  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);

  const tz = SQL.String({ tz: timezone });

  const query = safeSql`
    WITH toStartOfWeek(timestamp) AS week_start
    SELECT
      toDayOfWeek(toTimeZone(timestamp, ${tz})) as weekday,
      toHour(toTimeZone(timestamp, ${tz})) as hour,
      count() * any(_sample_factor) / uniq(week_start) as value
    FROM analytics.events ${sample}
    WHERE site_id = ${SQL.String({ siteId })}
      AND timestamp BETWEEN ${SQL.DateTime({ startDate: startDateTime })} AND ${SQL.DateTime({ endDate: endDateTime })}
      AND ${SQL.AND(filters)}
      AND event_type = 'pageview'
    GROUP BY weekday, hour
    ORDER BY weekday ASC, hour ASC
  `;

  const result = (await clickhouse.query(query.taggedSql, { params: query.taggedParams }).toPromise()) as any[];

  return result.map((row) =>
    WeeklyHeatmapRowSchema.parse({
      weekday: Number(row.weekday),
      hour: Number(row.hour),
      value: Number(row.value),
    }),
  );
}

export async function getWeeklyHeatmap(
  siteQuery: BASiteQuery,
  metric: HeatmapMetric,
): Promise<WeeklyHeatmapRow[]> {
  switch (metric) {
    case 'bounce_rate':
    case 'pages_per_session':
    case 'session_duration':
      return getSessionAggregateHeatmap(siteQuery, metric);
    case 'sessions':
    case 'unique_visitors':
      return getSessionCountHeatmap(siteQuery, metric);
    case 'pageviews':
      return getPageviewHeatmap(siteQuery);
  }
}
