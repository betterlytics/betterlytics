import { CompareMode } from '@/utils/compareRanges';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { TimeRangeValue } from '@/utils/timeRanges';
import moment from 'moment-timezone';

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

function floorToGranularity(date: moment.Moment, granularity: GranularityRangeValues | 'month') {
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
    case 'month':
      return date.startOf('month');
  }
}

function ceilToGranularity(date: moment.Moment, granularity: GranularityRangeValues | 'month') {
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
  }
}

function countBucketsBetween(start: moment.Moment, end: moment.Moment, granularity: GranularityRangeValues) {
  const unit = granularityUnit(granularity);
  const step = granularityStep(granularity);
  return end.diff(start, unit) / step;
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
) {
  if (timeRange === 'custom') {
    const start = floorToGranularity(moment.tz(customStart, timezone), 'day');
    const end = ceilToGranularity(moment.tz(customEnd, timezone), 'day');
    const customBuckets = countBucketsBetween(start, end, granularity);
    return {
      start: offsetTime(start, customBuckets, 'days', offset).clone(),
      end: offsetTime(end, customBuckets, 'days', offset).clone(),
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

function getCompareRange(
  mainStart: moment.Moment,
  mainEnd: moment.Moment,
  mode: CompareMode,
  alignWeekdays?: boolean,
) {
  if (mode === 'off') return undefined;
  if (mode === 'previous') {
    const diff = mainEnd.diff(mainStart, 'minutes');
    return {
      start: offsetTime(mainStart.clone(), diff, 'minutes', -1).clone(),
      end: mainStart.clone(),
    };
  }
}

interface ResolvedRange {
  start: Date;
  end: Date; // exclusive
}
interface TimeRangeResult {
  main: ResolvedRange;
  compare?: ResolvedRange;
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
  const main = getMainRange(timeRange, granularity, timezone, offset, startDate, endDate);

  const compare = getCompareRange(main.start.clone(), main.end.clone(), compareMode, compareAlignWeekdays);

  return {
    main: {
      start: main.start.toDate(),
      end: main.end.toDate(),
    },
    compare: compare
      ? {
          start: compare.start.toDate(),
          end: compare.end.toDate(),
        }
      : undefined,
  };
}
