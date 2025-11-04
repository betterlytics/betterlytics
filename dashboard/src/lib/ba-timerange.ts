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
    timeRange === 'last_month' ||
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
    case 'last_month':
    case 'ytd':
    case '1y':
      return 'day';
  }
}

function toRangeEnd(
  date: moment.Moment,
  timeRange: Exclude<TimeRangeValue, 'custom'>,
  granularity: GranularityRangeValues,
) {
  if (timeRange === 'last_month') {
    return date.startOf('month');
  }

  const actualGranularity = getRangeGranularity(timeRange, granularity);
  if (shouldIncludeCurrentBucket(timeRange)) {
    return ceilToGranularity(date, actualGranularity);
  }
  return floorToGranularity(date, actualGranularity);
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
  if (timeRange === 'custom') {
    throw new Error('custom time range is not supported yet');
  }

  const now = moment.tz(timezone);

  const baseEnd = toRangeEnd(now.clone(), timeRange, granularity);

  const mainEnd = getRangeOffset(baseEnd.clone(), timeRange, offset);
  const mainStart = toRangeStart(mainEnd.clone(), timeRange);

  return {
    main: {
      start: mainStart.toDate(),
      end: mainEnd.toDate(),
    },
    compare:
      compareStartDate && compareEndDate
        ? {
            start: compareStartDate,
            end: compareEndDate,
          }
        : undefined,
  };
}
