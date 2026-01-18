import { CompareMode } from '@/utils/compareRanges';
import {
  GranularityRangeValues,
  getAllowedGranularities,
  getValidGranularityFallback,
} from '@/utils/granularityRanges';
import { TimeRangeValue } from '@/utils/timeRanges';
import moment from 'moment-timezone';

type TimeRange = {
  start: moment.Moment;
  end: moment.Moment;
};

function shouldIncludeCurrentBucket(timeRange: TimeRangeValue) {
  return (
    timeRange === 'realtime' ||
    timeRange === '1h' ||
    timeRange === '24h' ||
    timeRange === 'today' ||
    timeRange === 'mtd' ||
    timeRange === 'ytd' ||
    timeRange === '1y' ||
    timeRange === 'custom'
  );
}

function floorToGranularity(date: moment.Moment, granularity: GranularityRangeValues) {
  switch (granularity) {
    case 'minute_1':
      return date.startOf('minute');
    case 'minute_15':
      return date.startOf('minute').subtract(date.minute() % 15, 'minutes');
    case 'minute_30':
      return date.startOf('minute').subtract(date.minute() % 30, 'minutes');
    case 'hour':
      return date.startOf('hour');
    case 'day':
      return date.startOf('day');
    case 'week':
      return date.startOf('isoWeek');
    case 'month':
      return date.startOf('month');
  }
}

function ceilToGranularity(date: moment.Moment, granularity: GranularityRangeValues) {
  switch (granularity) {
    case 'minute_1':
      return date.add(1, 'minute').startOf('minute');
    case 'minute_15':
      return date.add(15 - (date.minute() % 15), 'minutes').startOf('minute');
    case 'minute_30':
      return date.add(30 - (date.minute() % 30), 'minutes').startOf('minute');
    case 'hour':
      return date.add(1, 'hour').startOf('hour');
    case 'day':
      return date.add(1, 'day').startOf('day');
    case 'week':
      return date.add(1, 'week').startOf('isoWeek');
    case 'month':
      return date.add(1, 'month').startOf('month');
  }
}

function offsetTime(date: moment.Moment, amount: number, unit: moment.DurationInputArg2, offset: number) {
  return date.add(amount * offset, unit);
}

function getRangeOffset(date: moment.Moment, timeRange: Exclude<TimeRangeValue, 'custom'>, offset: number) {
  switch (timeRange) {
    case 'realtime':
      return offsetTime(date, 30, 'minutes', offset);
    case '1h':
      return offsetTime(date, 1, 'hour', offset);
    case '24h':
      return offsetTime(date, 24, 'hour', offset);
    case 'today':
      return offsetTime(date, 1, 'day', offset);
    case 'yesterday':
      return offsetTime(date, 1, 'day', offset);
    case '7d':
      return offsetTime(date, 7, 'days', offset);
    case '28d':
      return offsetTime(date, 28, 'days', offset);
    case '90d':
      return offsetTime(date, 90, 'days', offset);
    case 'mtd':
      return offsetTime(date, 1, 'month', offset);
    case 'last_month':
      return offsetTime(date, 1, 'month', offset);
    case 'ytd':
      return offsetTime(date, 1, 'year', offset);
    case '1y':
      return offsetTime(date, 1, 'year', offset);
  }
}

function getRangeGranularity(timeRange: Exclude<TimeRangeValue, 'custom'>, granularity: GranularityRangeValues) {
  switch (timeRange) {
    case 'realtime':
      return 'minute_1';
    case '1h':
      return 'minute_1';
    case '24h':
      return granularity;
    case 'today':
    case 'yesterday':
    case '7d':
    case '28d':
    case '90d':
    case 'mtd':
    case 'ytd':
    case '1y':
      return 'day';
    case 'last_month':
      return 'month';
  }
}

function toRangeEnd(
  date: moment.Moment,
  timeRange: Exclude<TimeRangeValue, 'custom'>,
  granularity: GranularityRangeValues,
) {
  const actualGranularity = getRangeGranularity(timeRange, granularity);
  if (shouldIncludeCurrentBucket(timeRange)) {
    return ceilToGranularity(date, actualGranularity);
  }
  return floorToGranularity(date, actualGranularity);
}

function granularityUnit(granularity: GranularityRangeValues) {
  switch (granularity) {
    case 'minute_1':
    case 'minute_15':
    case 'minute_30':
      return 'minute';
    case 'hour':
      return 'hour';
    case 'day':
      return 'day';
    case 'week':
      return 'week';
    case 'month':
      return 'month';
  }
}
function granularityStep(granularity: GranularityRangeValues) {
  switch (granularity) {
    case 'minute_1':
      return 1;
    case 'minute_15':
      return 15;
    case 'minute_30':
      return 30;
    case 'hour':
      return 1;
    case 'day':
      return 1;
    case 'week':
      return 1;
    case 'month':
      return 1;
  }
}

function countUnitsBetween(range: TimeRange, granularity: GranularityRangeValues) {
  const unit = granularityUnit(granularity);
  return range.end.diff(range.start, unit);
}

function countBucketsBetween(range: TimeRange, granularity: GranularityRangeValues) {
  const step = granularityStep(granularity);
  return countUnitsBetween(range, granularity) / step;
}

function toRangeStart(endDate: moment.Moment, timeRange: Exclude<TimeRangeValue, 'custom'>) {
  switch (timeRange) {
    case 'realtime':
      return endDate.subtract(30, 'minutes');
    case '1h':
      return endDate.subtract(1, 'hour');
    case '24h':
      return endDate.subtract(24, 'hour');
    case 'today':
      return endDate.subtract(1, 'day');
    case 'yesterday':
      return endDate.subtract(1, 'day');
    case '7d':
      return endDate.subtract(7, 'days');
    case '28d':
      return endDate.subtract(28, 'days');
    case '90d':
      return endDate.subtract(90, 'days');
    case 'mtd':
      return endDate.startOf('month');
    case 'last_month':
      return endDate.subtract(1, 'month');
    case 'ytd':
      return endDate.startOf('year');
    case '1y':
      return endDate.subtract(1, 'year');
  }
}

function getMainRange(
  timeRange: TimeRangeValue,
  granularity: GranularityRangeValues,
  timezone: string,
  offset: number,
  customStart?: Date,
  customEnd?: Date,
): TimeRange {
  if (timeRange === 'custom') {
    const base = {
      start: floorToGranularity(moment.tz(customStart, timezone), 'day'),
      end: ceilToGranularity(moment.tz(customEnd, timezone), 'day'),
    };

    const customBuckets = countBucketsBetween(base, 'day');
    return {
      start: offsetTime(base.start, customBuckets, 'days', offset).clone(),
      end: offsetTime(base.end, customBuckets, 'days', offset).clone(),
    };
  }

  const now = moment.tz(timezone);

  const baseEnd = toRangeEnd(now.clone(), timeRange, granularity);

  const mainEnd = getRangeOffset(baseEnd.clone(), timeRange, offset);
  const mainStart = toRangeStart(mainEnd.clone(), timeRange);

  return {
    start: mainStart.clone(),
    end: mainEnd.clone(),
  };
}

function alignWeekday(mainEnd: moment.Moment, compareEnd: moment.Moment, mode: 'previous' | 'year') {
  const mainWeekday = mainEnd.isoWeekday(); // 1..7
  const compareWeekday = compareEnd.isoWeekday();

  // compute delta to make cmpWeekday equal mainWeekday
  const forwardDelta = (mainWeekday - compareWeekday + 7) % 7;
  const backwardDelta = (compareWeekday - mainWeekday + 7) % 7;

  if (forwardDelta === 0) return compareEnd.clone();

  if (mode === 'previous') {
    // prefer shifting backwards (so compare period sits before main)
    const shift = backwardDelta === 0 ? 0 : -backwardDelta;
    return compareEnd.clone().add(shift, 'day');
  }
  // 'year' mode - prefer shifting forward
  return compareEnd.clone().add(forwardDelta, 'day');
}

function getCompareRange(
  range: TimeRange,
  mode: CompareMode,
  granularity: GranularityRangeValues,
  shouldAlignWeekdays?: boolean,
  customCompareRange?: TimeRange,
) {
  if (mode === 'off') return undefined;
  const diff = countUnitsBetween(range, granularity);
  const unit = granularityUnit(granularity);
  const offsetStart = (end: moment.Moment) => offsetTime(end.clone(), diff, unit, -1).clone();
  const offsetEnd = (start: moment.Moment) => offsetTime(start.clone(), diff, unit, 1).clone();
  if (mode === 'previous') {
    const baseEnd = shouldAlignWeekdays
      ? alignWeekday(range.end.clone(), range.start.clone(), mode)
      : range.start.clone();

    return {
      start: offsetStart(baseEnd),
      end: baseEnd.clone(),
    };
  }
  if (mode === 'year') {
    const endLastYear = range.end.clone().subtract(1, 'year');
    const baseEnd = shouldAlignWeekdays ? alignWeekday(range.end.clone(), endLastYear.clone(), mode) : endLastYear;

    return {
      start: offsetStart(baseEnd),
      end: baseEnd.clone(),
    };
  }
  if (mode === 'custom' && customCompareRange) {
    // Align end time of day
    const alignedStart = customCompareRange.start.clone().set({
      hour: range.start.hour(),
      minute: range.start.minute(),
      second: range.start.second(),
      millisecond: range.start.millisecond(),
    });
    return {
      start: alignedStart.clone(),
      end: offsetEnd(alignedStart),
    };
  }
}

export interface TimeRangeResult {
  main: {
    start: Date;
    end: Date;
  };
  compare?: {
    start: Date;
    end: Date;
  };
  granularity: GranularityRangeValues;
}

export function getResolvedRanges(
  timeRange: TimeRangeValue,
  compareMode: CompareMode,
  timezone: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  compareStartDate?: Date,
  compareEndDate?: Date,
  offset: number = 0,
  compareAlignWeekdays?: boolean,
): TimeRangeResult {
  const resolve = (
    targetGranularity: GranularityRangeValues,
    customStart: Date | undefined,
    customEnd: Date | undefined,
  ) => {
    const mainRange = getMainRange(timeRange, targetGranularity, timezone, offset, customStart, customEnd);

    const customCompareRange =
      compareStartDate && compareEndDate
        ? {
            start: floorToGranularity(moment.tz(compareStartDate, timezone), 'day'),
            end: ceilToGranularity(moment.tz(compareEndDate, timezone), 'day'),
          }
        : undefined;

    const compareRange = getCompareRange(
      mainRange,
      compareMode,
      targetGranularity,
      compareAlignWeekdays,
      customCompareRange,
    );

    return {
      // use start/end for Date conversion
      mainRange,
      compareRange,
      result: {
        main: {
          start: mainRange.start.toDate(),
          end: mainRange.end.clone().subtract(1, 'second').toDate(),
        },
        compare: compareRange
          ? {
              start: compareRange.start.toDate(),
              end: compareRange.end.clone().subtract(1, 'second').toDate(),
            }
          : undefined,
      },
    } as const;
  };

  const initial = resolve(granularity, startDate, endDate);

  const nextStart = initial.result.main.start;
  let nextEnd = initial.result.main.end;
  let nextGranularity = granularity;

  const maxMs = 366 * 24 * 60 * 60 * 1000;
  if (nextEnd.getTime() - nextStart.getTime() > maxMs) {
    nextEnd = new Date(nextStart.getTime() + maxMs);
  }

  const allowed = getAllowedGranularities(nextStart, nextEnd);
  nextGranularity = getValidGranularityFallback(nextGranularity, allowed);

  const needsRecompute =
    nextEnd.getTime() !== initial.result.main.end.getTime() || nextGranularity !== granularity;

  if (!needsRecompute) {
    return {
      ...initial.result,
      granularity,
    };
  }

  const recomputed = resolve(nextGranularity, nextStart, nextEnd);

  return {
    ...recomputed.result,
    granularity: nextGranularity,
  };
}

/**
 * Checks if current time is in the first bucket of the time range
 */
export function isNowInFirstBucket(result: TimeRangeResult, timezone: string) {
  const now = moment.tz(Date.now(), timezone);
  const start = moment.tz(result.main.start, timezone);

  const bucketGranularity = getAllowedGranularities(result.main.start, result.main.end)[0];

  const bucketsBetween = countBucketsBetween({ start, end: now }, bucketGranularity);

  return bucketsBetween < 1;
}
