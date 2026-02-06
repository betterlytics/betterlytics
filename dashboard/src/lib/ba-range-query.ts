'server only';

import { safeSql, SQL } from './safe-sql';

export type BARangeQueryObject = {
  now: number;
  timezone: string;
  range: 'realtime' | '1h' | '24h' | 'today' | 'yesterday' | '7d' | '28d' | '90d' | 'mtd' | 'last_month' | 'ytd' | '1y';
  granularity: 'minute_1' | 'minute_15' | 'minute_30' | 'hour' | 'day';
  offset?: number;
};

export function getBuckets({ range, granularity, timezone, now, offset = 0 }: BARangeQueryObject) {
  return safeSql`
    toDateTime(${SQL.UInt32({ now })}, ${SQL.String({ timezone })}) AS now_tz,

    -- Ceil to granularity helper (used for ranges that include current bucket)
    CASE ${SQL.String({ granularity })}
      WHEN 'minute_1' THEN toStartOfInterval(now_tz + INTERVAL 1 MINUTE, INTERVAL 1 MINUTE)
      WHEN 'minute_15' THEN toStartOfInterval(now_tz + INTERVAL 15 MINUTE, INTERVAL 15 MINUTE)
      WHEN 'minute_30' THEN toStartOfInterval(now_tz + INTERVAL 30 MINUTE, INTERVAL 30 MINUTE)
      WHEN 'hour' THEN toStartOfHour(now_tz + INTERVAL 1 HOUR)
      WHEN 'day' THEN toStartOfDay(now_tz + INTERVAL 1 DAY)
    END AS ceil_to_granularity,

    -- Compute base end (before offset)
    -- Note: realtime/1h use minute_1, 24h uses passed granularity, today/mtd/ytd/1y use day granularity
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

    -- Apply offset to get final end
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

    -- Compute start from end
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
