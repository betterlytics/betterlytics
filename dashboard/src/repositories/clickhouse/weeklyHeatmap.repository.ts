import { clickhouse } from '@/lib/clickhouse';
import { DateTimeString } from '@/types/dates';
import { HeatmapMetric, WeeklyHeatmapRow, WeeklyHeatmapRowSchema } from '@/entities/analytics/weeklyHeatmap';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { QueryFilter } from '@/entities/analytics/filter';

function getBaseAggregation(metric: HeatmapMetric) {
  switch (metric) {
    case 'pageviews':
      return safeSql`count()`;
    case 'unique_visitors':
      return safeSql`uniq(visitor_id)`;
    case 'sessions':
      return safeSql`uniq(session_id)`;
    case 'bounce_rate':
      return safeSql`1`;
    case 'pages_per_session':
      return safeSql`1`;
    case 'session_duration':
      return safeSql`1`;
  }
}

export async function getWeeklyHeatmap(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  metric: HeatmapMetric,
  queryFilters: QueryFilter[],
  tz?: string,
): Promise<WeeklyHeatmapRow[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);
  const timezone = tz ?? 'UTC';

  if (metric === 'bounce_rate' || metric === 'pages_per_session' || metric === 'session_duration') {
    // Build from session_data per hour bucket then aggregate by weekday/hour across the range
    const query = safeSql`
      WITH session_data AS (
        WITH
          toStartOfWeek(timestamp) AS week_start
        SELECT
          session_id,
          toDayOfWeek(toTimeZone(timestamp, {tz:String})) as weekday,
          toHour(toTimeZone(timestamp, {tz:String})) as hour,
          count() / uniq(week_start) as page_count,
          if(count() > 1, dateDiff('second', min(timestamp), max(timestamp)), 0) as duration_seconds
        FROM analytics.events
        WHERE site_id = {site_id:String}
          AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
          AND ${SQL.AND(filters)}
          AND event_type = 'pageview'
        GROUP BY session_id, weekday, hour
      )
      SELECT
        any(toDateTime64(0, 3)) as date,
        weekday,
        hour,
        ${
          metric === 'bounce_rate'
            ? safeSql`if(count() > 0, round((count() - countIf(page_count > 1)) / count() * 100, 1), 0)`
            : metric === 'pages_per_session'
              ? safeSql`if(count() > 0, round(sum(page_count) / count(), 1), 0)`
              : safeSql`if(countIf(page_count > 1) > 0, round(avgIf(duration_seconds, page_count > 1), 0), 0)`
        } as value
      FROM session_data
      GROUP BY weekday, hour
      ORDER BY weekday ASC, hour ASC
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: {
          ...query.taggedParams,
          site_id: siteId,
          start: startDate,
          end: endDate,
          tz: timezone,
        },
      })
      .toPromise()) as any[];

    return result.map((row) =>
      WeeklyHeatmapRowSchema.parse({
        date: new Date().toISOString(),
        weekday: Number(row.weekday),
        hour: Number(row.hour),
        value: Number(row.value),
      }),
    );
  }

  const aggregation = getBaseAggregation(metric);

  const query = safeSql`
    WITH
      toStartOfWeek(timestamp) AS week_start
    SELECT
      any(toStartOfHour(toTimeZone(timestamp, {tz:String}))) as date,
      toDayOfWeek(toTimeZone(timestamp, {tz:String})) as weekday,
      toHour(toTimeZone(timestamp, {tz:String})) as hour,
      ${aggregation} / uniq(week_start) as value
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
      ${metric === 'pageviews' ? safeSql`AND event_type = 'pageview'` : safeSql``}
    GROUP BY weekday, hour
    ORDER BY weekday ASC, hour ASC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
        tz: timezone,
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    WeeklyHeatmapRowSchema.parse({
      date: String(row.date),
      weekday: Number(row.weekday),
      hour: Number(row.hour),
      value: Number(row.value),
    }),
  );
}
