'server only';

import { safeSql, SQL } from './safe-sql';

export type BARangeQueryObject = {
  now: number;
  timezone: string;
  range: 'realtime' | '1h' | '24h' | 'today' | 'yesterday' | '7d' | '28d' | '90d' | 'mtd' | 'last_month' | 'ytd' | '1y';
  granularity: 'minute_1' | 'minute_15' | 'minute_30' | 'hour' | 'day';
  offset?: number;
  compareMode?: 'off' | 'previous' | 'year';
};

export function getBucketsBase({ range, granularity, timezone, now, offset = 0 }: Omit<BARangeQueryObject, 'compareMode'>) {
  return safeSql`
    toDateTime(${SQL.UInt32({ now })}, ${SQL.String({ timezone })}) AS now_tz,

    CASE ${SQL.String({ granularity })}
      WHEN 'minute_1' THEN toStartOfInterval(now_tz + INTERVAL 1 MINUTE, INTERVAL 1 MINUTE)
      WHEN 'minute_15' THEN toStartOfInterval(now_tz + INTERVAL 15 MINUTE, INTERVAL 15 MINUTE)
      WHEN 'minute_30' THEN toStartOfInterval(now_tz + INTERVAL 30 MINUTE, INTERVAL 30 MINUTE)
      WHEN 'hour' THEN toStartOfHour(now_tz + INTERVAL 1 HOUR)
      WHEN 'day' THEN toStartOfDay(now_tz + INTERVAL 1 DAY)
    END AS ceil_to_granularity,

    CASE ${SQL.String({ range })}
      WHEN 'realtime' THEN toStartOfInterval(now_tz + INTERVAL 1 MINUTE, INTERVAL 1 MINUTE)
      WHEN '1h' THEN toStartOfInterval(now_tz + INTERVAL 1 MINUTE, INTERVAL 1 MINUTE)
      WHEN '24h' THEN ceil_to_granularity
      WHEN 'today' THEN toStartOfDay(now_tz + INTERVAL 1 DAY)
      WHEN 'yesterday' THEN toStartOfDay(now_tz)
      WHEN '7d' THEN toStartOfDay(now_tz)
      WHEN '28d' THEN toStartOfDay(now_tz)
      WHEN '90d' THEN toStartOfDay(now_tz)
      WHEN 'mtd' THEN toStartOfDay(now_tz + INTERVAL 1 DAY)
      WHEN 'last_month' THEN toStartOfMonth(now_tz)
      WHEN 'ytd' THEN toStartOfDay(now_tz + INTERVAL 1 DAY)
      WHEN '1y' THEN toStartOfDay(now_tz + INTERVAL 1 DAY)
    END AS base_end_tz,

    CASE ${SQL.String({ range })}
      WHEN 'realtime' THEN base_end_tz + INTERVAL (30 * ${SQL.Int32({ offset })}) MINUTE
      WHEN '1h' THEN base_end_tz + INTERVAL ${SQL.Int32({ offset })} HOUR
      WHEN '24h' THEN base_end_tz + INTERVAL (24 * ${SQL.Int32({ offset })}) HOUR
      WHEN 'today' THEN base_end_tz + INTERVAL ${SQL.Int32({ offset })} DAY
      WHEN 'yesterday' THEN base_end_tz + INTERVAL ${SQL.Int32({ offset })} DAY
      WHEN '7d' THEN base_end_tz + INTERVAL (7 * ${SQL.Int32({ offset })}) DAY
      WHEN '28d' THEN base_end_tz + INTERVAL (28 * ${SQL.Int32({ offset })}) DAY
      WHEN '90d' THEN base_end_tz + INTERVAL (90 * ${SQL.Int32({ offset })}) DAY
      WHEN 'mtd' THEN base_end_tz + INTERVAL ${SQL.Int32({ offset })} MONTH
      WHEN 'last_month' THEN base_end_tz + INTERVAL ${SQL.Int32({ offset })} MONTH
      WHEN 'ytd' THEN base_end_tz + INTERVAL ${SQL.Int32({ offset })} YEAR
      WHEN '1y' THEN base_end_tz + INTERVAL ${SQL.Int32({ offset })} YEAR
    END AS range_end_tz,

    CASE ${SQL.String({ range })}
      WHEN 'realtime' THEN range_end_tz - INTERVAL 30 MINUTE
      WHEN '1h' THEN range_end_tz - INTERVAL 1 HOUR
      WHEN '24h' THEN range_end_tz - INTERVAL 24 HOUR
      WHEN 'today' THEN range_end_tz - INTERVAL 1 DAY
      WHEN 'yesterday' THEN toStartOfDay(range_end_tz - INTERVAL 1 DAY)
      WHEN '7d' THEN range_end_tz - INTERVAL 7 DAY
      WHEN '28d' THEN range_end_tz - INTERVAL 28 DAY
      WHEN '90d' THEN range_end_tz - INTERVAL 90 DAY
      WHEN 'mtd' THEN toStartOfMonth(range_end_tz - INTERVAL 1 DAY)
      WHEN 'last_month' THEN range_end_tz - INTERVAL 1 MONTH
      WHEN 'ytd' THEN toStartOfYear(range_end_tz - INTERVAL 1 DAY)
      WHEN '1y' THEN range_end_tz - INTERVAL 1 YEAR
    END AS range_start_tz,

    toTimezone(range_start_tz, 'UTC') AS range_start,
    toTimezone(range_end_tz, 'UTC') AS range_end
  `;
}

export function getBuckets({ range, granularity, timezone, now, offset = 0, compareMode = 'off' }: BARangeQueryObject) {
  const base = getBucketsBase({ range, granularity, timezone, now, offset });

  if (compareMode === 'off') {
    return base;
  }

  return safeSql`
    base.*,

    CASE ${SQL.String({ granularity })}
      WHEN 'minute_1' THEN dateDiff('minute', base.range_start_tz, base.range_end_tz)
      WHEN 'minute_15' THEN dateDiff('minute', base.range_start_tz, base.range_end_tz)
      WHEN 'minute_30' THEN dateDiff('minute', base.range_start_tz, base.range_end_tz)
      WHEN 'hour' THEN dateDiff('hour', base.range_start_tz, base.range_end_tz)
      WHEN 'day' THEN dateDiff('day', base.range_start_tz, base.range_end_tz)
    END AS diff_units,

    CASE ${SQL.String({ compareMode })}
      WHEN 'previous' THEN base.range_start_tz
      WHEN 'year' THEN base.range_end_tz - INTERVAL 1 YEAR
    END AS compare_end_tz,

    CASE ${SQL.String({ granularity })}
      WHEN 'minute_1' THEN subtractMinutes(compare_end_tz, diff_units)
      WHEN 'minute_15' THEN subtractMinutes(compare_end_tz, diff_units)
      WHEN 'minute_30' THEN subtractMinutes(compare_end_tz, diff_units)
      WHEN 'hour' THEN subtractHours(compare_end_tz, diff_units)
      WHEN 'day' THEN subtractDays(compare_end_tz, diff_units)
    END AS compare_start_tz,

    toTimezone(compare_start_tz, 'UTC') AS compare_start,
    toTimezone(compare_end_tz, 'UTC') AS compare_end
  FROM (SELECT ${base}) AS base`;
}
