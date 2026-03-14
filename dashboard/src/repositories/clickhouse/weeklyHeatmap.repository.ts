import { clickhouse } from '@/lib/clickhouse';
import {
  HeatmapMetric,
  WeeklyHeatmapRow,
  WeeklyHeatmapRowSchema,
} from '@/entities/analytics/weeklyHeatmap.entities';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

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

export async function getWeeklyHeatmap(siteQuery: BASiteQuery, metric: HeatmapMetric): Promise<WeeklyHeatmapRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const timezone = siteQuery.timezone ?? 'UTC';
  const filters = BAQuery.getFilterQuery(queryFilters);

  if (metric === 'bounce_rate' || metric === 'pages_per_session' || metric === 'session_duration') {
    const query = safeSql`
      SELECT
        any(toDateTime64(0, 3)) as date,
        toDayOfWeek(toTimeZone(session_start, {tz:String})) as weekday,
        toHour(toTimeZone(session_start, {tz:String})) as hour,
        ${
          metric === 'bounce_rate'
            ? safeSql`if(count() > 0, round((count() - countIf(pageview_count > 1)) / count() * 100, 1), 0)`
            : metric === 'pages_per_session'
              ? safeSql`if(count() > 0, round(sum(pageview_count) / count(), 1), 0)`
              : safeSql`if(countIf(pageview_count > 1) > 0, round(avgIf(dateDiff('second', session_start, session_end), pageview_count > 1), 0), 0)`
        } as value
      FROM analytics.sessions FINAL
      WHERE site_id = {site_id:String}
        AND session_start BETWEEN {start:DateTime} AND {end:DateTime}
        AND ${SQL.AND(filters)}
      GROUP BY weekday, hour
      ORDER BY weekday ASC, hour ASC
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: {
          ...query.taggedParams,
          site_id: siteId,
          start: startDateTime,
          end: endDateTime,
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
      AND event_type = 'pageview'
    GROUP BY weekday, hour
    ORDER BY weekday ASC, hour ASC
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
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
