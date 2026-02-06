'server only';

import { safeSql, SQL } from './safe-sql';

export type BARangeQueryObject = {
  now: number;
  timezone: string;
  range:
    | 'realtime'
    | '1h'
    | '24h'
    | 'today'
    | 'yesterday'
    | '7d'
    | '28d'
    | '90d'
    | 'mtd'
    | 'last_month'
    | 'ytd'
    | '1y'
    | 'custom';
  granularity: 'minute_1' | 'minute_15' | 'minute_30' | 'hour' | 'day' | 'week' | 'month';
  offset?: number;
  compareMode?: 'off' | 'previous' | 'year' | 'custom';
  compareAlignWeekdays?: boolean;
  customStart?: number;
  customEnd?: number;
  customCompareStart?: number;
  customCompareEnd?: number;
};

export function getBucketsBase({
  range,
  granularity,
  timezone,
  now,
  offset = 0,
  customStart,
  customEnd,
}: Omit<BARangeQueryObject, 'compareMode' | 'compareAlignWeekdays' | 'customCompareStart' | 'customCompareEnd'>) {
  if (range === 'custom') {
    return safeSql`
      toDateTime(${SQL.UInt32({ now })}, ${SQL.String({ timezone })}) AS now_tz,
      toDateTime(${SQL.UInt32({ now })}, ${SQL.String({ timezone })}) AS ceil_to_granularity,

      toStartOfDay(toDateTime(${SQL.UInt32({ customStart: customStart ?? 0 })}, ${SQL.String({ timezone })}), ${SQL.String({ timezone })}) AS custom_start_floored,
      toStartOfDay(toDateTime(${SQL.UInt32({ customEnd: customEnd ?? 0 })}, ${SQL.String({ timezone })}) + INTERVAL 1 DAY, ${SQL.String({ timezone })}) AS custom_end_ceiled,
      dateDiff('day', custom_start_floored, custom_end_ceiled) AS custom_buckets,

      custom_end_ceiled AS base_end_tz,
      addDays(custom_end_ceiled, custom_buckets * ${SQL.Int32({ offset })}) AS range_end_tz,
      addDays(custom_start_floored, custom_buckets * ${SQL.Int32({ offset })}) AS range_start_tz,

      toTimezone(range_start_tz, 'UTC') AS range_start,
      toTimezone(range_end_tz, 'UTC') AS range_end
    `;
  }

  return safeSql`
    toDateTime(${SQL.UInt32({ now })}, ${SQL.String({ timezone })}) AS now_tz,

    CASE ${SQL.String({ granularity })}
      WHEN 'minute_1' THEN toStartOfInterval(now_tz + INTERVAL 1 MINUTE, INTERVAL 1 MINUTE)
      WHEN 'minute_15' THEN toStartOfInterval(now_tz + INTERVAL 15 MINUTE, INTERVAL 15 MINUTE)
      WHEN 'minute_30' THEN toStartOfInterval(now_tz + INTERVAL 30 MINUTE, INTERVAL 30 MINUTE)
      WHEN 'hour' THEN toStartOfHour(now_tz + INTERVAL 1 HOUR)
      WHEN 'day' THEN toStartOfDay(now_tz + INTERVAL 1 DAY)
      WHEN 'week' THEN toStartOfWeek(now_tz + INTERVAL 1 WEEK, 1)
      WHEN 'month' THEN toStartOfMonth(now_tz + INTERVAL 1 MONTH)
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
      WHEN 'ytd' THEN
        CASE ${SQL.String({ granularity })}
          WHEN 'week' THEN toDateTime(toStartOfWeek(toStartOfYear(range_end_tz - INTERVAL 1 DAY), 1), ${SQL.String({ timezone })})
          ELSE toStartOfYear(range_end_tz - INTERVAL 1 DAY)
        END
      WHEN '1y' THEN range_end_tz - INTERVAL 1 YEAR
    END AS range_start_tz,

    toTimezone(range_start_tz, 'UTC') AS range_start,
    toTimezone(range_end_tz, 'UTC') AS range_end
  `;
}

function getCompareSQL(
  granularity: BARangeQueryObject['granularity'],
  compareMode: Exclude<BARangeQueryObject['compareMode'], 'off' | undefined>,
  compareAlignWeekdays: boolean,
  customCompareStart?: number,
  customCompareEnd?: number,
  timezone?: string,
) {
  const isCoarse = granularity === 'week' || granularity === 'month';

  if (isCoarse) {
    return getCoarseCompareSQL(granularity, compareMode, compareAlignWeekdays, customCompareStart, customCompareEnd, timezone);
  }

  return getFineCompareSQL(granularity, compareMode, compareAlignWeekdays, customCompareStart, customCompareEnd, timezone);
}

function getFineCompareSQL(
  granularity: BARangeQueryObject['granularity'],
  compareMode: Exclude<BARangeQueryObject['compareMode'], 'off' | undefined>,
  compareAlignWeekdays: boolean,
  customCompareStart?: number,
  customCompareEnd?: number,
  timezone?: string,
) {
  const diffUnitsSQL = safeSql`
    CASE ${SQL.String({ granularity })}
      WHEN 'minute_1' THEN dateDiff('minute', base.range_start_tz, base.range_end_tz)
      WHEN 'minute_15' THEN dateDiff('minute', base.range_start_tz, base.range_end_tz)
      WHEN 'minute_30' THEN dateDiff('minute', base.range_start_tz, base.range_end_tz)
      WHEN 'hour' THEN dateDiff('hour', base.range_start_tz, base.range_end_tz)
      WHEN 'day' THEN dateDiff('day', base.range_start_tz, base.range_end_tz)
    END AS diff_units`;

  const subtractDiffSQL = safeSql`
    CASE ${SQL.String({ granularity })}
      WHEN 'minute_1' THEN subtractMinutes(compare_end_tz, diff_units)
      WHEN 'minute_15' THEN subtractMinutes(compare_end_tz, diff_units)
      WHEN 'minute_30' THEN subtractMinutes(compare_end_tz, diff_units)
      WHEN 'hour' THEN subtractHours(compare_end_tz, diff_units)
      WHEN 'day' THEN subtractDays(compare_end_tz, diff_units)
    END AS compare_start_tz`;

  if (compareMode === 'custom') {
    return safeSql`
      ${diffUnitsSQL},

      toStartOfDay(toDateTime(${SQL.UInt32({ customCompareStart: customCompareStart ?? 0 })}, ${SQL.String({ timezone: timezone ?? 'UTC' })}), ${SQL.String({ timezone: timezone ?? 'UTC' })}) AS custom_compare_start_floored,

      toDateTime(
        toUnixTimestamp(custom_compare_start_floored) +
        (toHour(base.range_start_tz) * 3600) +
        (toMinute(base.range_start_tz) * 60) +
        toSecond(base.range_start_tz),
        ${SQL.String({ timezone: timezone ?? 'UTC' })}
      ) AS compare_start_aligned,

      CASE ${SQL.String({ granularity })}
        WHEN 'minute_1' THEN addMinutes(compare_start_aligned, diff_units)
        WHEN 'minute_15' THEN addMinutes(compare_start_aligned, diff_units)
        WHEN 'minute_30' THEN addMinutes(compare_start_aligned, diff_units)
        WHEN 'hour' THEN addHours(compare_start_aligned, diff_units)
        WHEN 'day' THEN addDays(compare_start_aligned, diff_units)
      END AS compare_end_tz,

      compare_start_aligned AS compare_start_tz`;
  }

  if (!compareAlignWeekdays) {
    return safeSql`
      ${diffUnitsSQL},

      CASE ${SQL.String({ compareMode })}
        WHEN 'previous' THEN base.range_start_tz
        WHEN 'year' THEN base.range_end_tz - INTERVAL 1 YEAR
      END AS compare_end_tz,

      ${subtractDiffSQL}`;
  }

  return safeSql`
    ${diffUnitsSQL},

    toDayOfWeek(base.range_end_tz) AS main_weekday,

    CASE ${SQL.String({ compareMode })}
      WHEN 'previous' THEN base.range_start_tz
      WHEN 'year' THEN base.range_end_tz - INTERVAL 1 YEAR
    END AS compare_end_base,

    toDayOfWeek(compare_end_base) AS compare_weekday,

    (toInt32(main_weekday) - toInt32(compare_weekday) + 7) % 7 AS forward_delta,
    (toInt32(compare_weekday) - toInt32(main_weekday) + 7) % 7 AS backward_delta,

    CASE ${SQL.String({ compareMode })}
      WHEN 'previous' THEN
        CASE
          WHEN forward_delta = 0 THEN compare_end_base
          ELSE subtractDays(compare_end_base, backward_delta)
        END
      WHEN 'year' THEN addDays(compare_end_base, forward_delta)
    END AS compare_end_tz,

    ${subtractDiffSQL}`;
}

function getCoarseCompareSQL(
  granularity: 'week' | 'month',
  compareMode: Exclude<BARangeQueryObject['compareMode'], 'off' | undefined>,
  compareAlignWeekdays: boolean,
  customCompareStart?: number,
  customCompareEnd?: number,
  timezone?: string,
) {
  const tz = SQL.String({ timezone: timezone ?? 'UTC' });

  if (compareMode === 'custom') {
    const floorToGranSQL =
      granularity === 'week'
        ? safeSql`toStartOfWeek(base.range_start_tz, 1)`
        : safeSql`toStartOfMonth(base.range_start_tz)`;

    const snapCeilToGranSQL =
      granularity === 'week'
        ? safeSql`
            if(
              base.range_end_tz = toStartOfWeek(base.range_end_tz, 1),
              base.range_end_tz,
              toStartOfWeek(base.range_end_tz + INTERVAL 1 WEEK, 1)
            )`
        : safeSql`
            if(
              base.range_end_tz = toStartOfMonth(base.range_end_tz),
              base.range_end_tz,
              toStartOfMonth(base.range_end_tz + INTERVAL 1 MONTH)
            )`;

    const floorCustomStartSQL =
      granularity === 'week'
        ? safeSql`toDateTime(toStartOfWeek(custom_compare_start_with_time, 1), ${tz})`
        : safeSql`toDateTime(toStartOfMonth(custom_compare_start_with_time), ${tz})`;

    const addBucketsSQL =
      granularity === 'week'
        ? safeSql`toDateTime(addWeeks(aligned_custom_start, coarse_buckets), ${tz}) AS compare_end_tz`
        : safeSql`toDateTime(addMonths(aligned_custom_start, coarse_buckets), ${tz}) AS compare_end_tz`;

    return safeSql`
      ${floorToGranSQL} AS aligned_start,
      ${snapCeilToGranSQL} AS aligned_end,
      dateDiff(${SQL.String({ granularity })}, aligned_start, aligned_end) AS coarse_buckets,

      toStartOfDay(toDateTime(${SQL.UInt32({ customCompareStart: customCompareStart ?? 0 })}, ${tz}), ${tz}) AS custom_compare_start_floored,

      toDateTime(
        toUnixTimestamp(custom_compare_start_floored) +
        (toHour(base.range_start_tz) * 3600) +
        (toMinute(base.range_start_tz) * 60) +
        toSecond(base.range_start_tz),
        ${tz}
      ) AS custom_compare_start_with_time,

      ${floorCustomStartSQL} AS aligned_custom_start,
      ${addBucketsSQL},
      custom_compare_start_with_time AS compare_start_tz`;
  }

  if (granularity === 'week') {
    if (!compareAlignWeekdays) {
      return safeSql`
        dateDiff('day', base.range_start_tz, base.range_end_tz) AS day_span,

        CASE ${SQL.String({ compareMode })}
          WHEN 'previous' THEN base.range_start_tz
          WHEN 'year' THEN base.range_end_tz - INTERVAL 1 YEAR
        END AS compare_end_tz,

        subtractDays(compare_end_tz, day_span) AS compare_start_tz`;
    }

    return safeSql`
      dateDiff('day', base.range_start_tz, base.range_end_tz) AS day_span,

      toDayOfWeek(base.range_end_tz) AS main_weekday,

      CASE ${SQL.String({ compareMode })}
        WHEN 'previous' THEN base.range_start_tz
        WHEN 'year' THEN base.range_end_tz - INTERVAL 1 YEAR
      END AS compare_end_unaligned,

      toDayOfWeek(compare_end_unaligned) AS compare_weekday,

      (toInt32(main_weekday) - toInt32(compare_weekday) + 7) % 7 AS forward_delta,
      (toInt32(compare_weekday) - toInt32(main_weekday) + 7) % 7 AS backward_delta,

      CASE ${SQL.String({ compareMode })}
        WHEN 'previous' THEN
          CASE
            WHEN forward_delta = 0 THEN compare_end_unaligned
            ELSE subtractDays(compare_end_unaligned, backward_delta)
          END
        WHEN 'year' THEN addDays(compare_end_unaligned, forward_delta)
      END AS compare_end_tz,

      subtractDays(compare_end_tz, day_span) AS compare_start_tz`;
  }

  const snapCeilToGranSQL = safeSql`
    if(
      base.range_end_tz = toStartOfMonth(base.range_end_tz),
      base.range_end_tz,
      toStartOfMonth(base.range_end_tz + INTERVAL 1 MONTH)
    )`;

  const snapCeilCompareEndSQL = safeSql`
    if(
      compare_end_base = toStartOfMonth(compare_end_base),
      compare_end_base,
      toDateTime(toStartOfMonth(compare_end_base + INTERVAL 1 MONTH), ${tz})
    ) AS aligned_compare_end`;

  if (!compareAlignWeekdays) {
    return safeSql`
      toStartOfMonth(base.range_start_tz) AS aligned_start,
      ${snapCeilToGranSQL} AS aligned_end,
      dateDiff('month', aligned_start, aligned_end) AS month_buckets,

      CASE ${SQL.String({ compareMode })}
        WHEN 'previous' THEN base.range_start_tz
        WHEN 'year' THEN base.range_end_tz - INTERVAL 1 YEAR
      END AS compare_end_base,

      ${snapCeilCompareEndSQL},
      toDateTime(subtractMonths(aligned_compare_end, month_buckets), ${tz}) AS compare_start_tz,
      compare_end_base AS compare_end_tz`;
  }

  return safeSql`
    toStartOfMonth(base.range_start_tz) AS aligned_start,
    ${snapCeilToGranSQL} AS aligned_end,
    dateDiff('month', aligned_start, aligned_end) AS month_buckets,

    toDayOfWeek(base.range_end_tz) AS main_weekday,

    CASE ${SQL.String({ compareMode })}
      WHEN 'previous' THEN base.range_start_tz
      WHEN 'year' THEN base.range_end_tz - INTERVAL 1 YEAR
    END AS compare_end_unaligned,

    toDayOfWeek(compare_end_unaligned) AS compare_weekday,

    (toInt32(main_weekday) - toInt32(compare_weekday) + 7) % 7 AS forward_delta,
    (toInt32(compare_weekday) - toInt32(main_weekday) + 7) % 7 AS backward_delta,

    CASE ${SQL.String({ compareMode })}
      WHEN 'previous' THEN
        CASE
          WHEN forward_delta = 0 THEN compare_end_unaligned
          ELSE subtractDays(compare_end_unaligned, backward_delta)
        END
      WHEN 'year' THEN addDays(compare_end_unaligned, forward_delta)
    END AS compare_end_base,

    ${snapCeilCompareEndSQL},
    toDateTime(subtractMonths(aligned_compare_end, month_buckets), ${tz}) AS compare_start_tz,
    compare_end_base AS compare_end_tz`;
}

export function getBuckets({
  range,
  granularity,
  timezone,
  now,
  offset = 0,
  compareMode = 'off',
  compareAlignWeekdays = false,
  customStart,
  customEnd,
  customCompareStart,
  customCompareEnd,
}: BARangeQueryObject) {
  const base = getBucketsBase({ range, granularity, timezone, now, offset, customStart, customEnd });

  if (compareMode === 'off') {
    return base;
  }

  const compareSQL = getCompareSQL(granularity, compareMode, compareAlignWeekdays, customCompareStart, customCompareEnd, timezone);

  return safeSql`
    base.*,

    ${compareSQL},

    toTimezone(compare_start_tz, 'UTC') AS compare_start,
    toTimezone(compare_end_tz, 'UTC') AS compare_end
  FROM (SELECT ${base}) AS base`;
}
