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

export interface TimeRangeResult {
  main: {
    start: Date;
    end: Date;
  };
  displayEnd?: Date;
  compare?: {
    start: Date;
    end: Date;
  };
  granularity: GranularityRangeValues;
  startBucketIncomplete: boolean;
}

type GranularityConfig = {
  unit: moment.unitOfTime.DurationConstructor;
  step: number;
  floor: (d: moment.Moment) => moment.Moment;
};

const GRANULARITY_CONFIG: Record<GranularityRangeValues, GranularityConfig> = {
  minute_1: { unit: 'minute', step: 1, floor: (d) => d.startOf('minute') },
  minute_15: {
    unit: 'minute',
    step: 15,
    floor: (d) => d.startOf('minute').subtract(d.minute() % 15, 'minutes'),
  },
  minute_30: {
    unit: 'minute',
    step: 30,
    floor: (d) => d.startOf('minute').subtract(d.minute() % 30, 'minutes'),
  },
  hour: { unit: 'hour', step: 1, floor: (d) => d.startOf('hour') },
  day: { unit: 'day', step: 1, floor: (d) => d.startOf('day') },
  week: { unit: 'week', step: 1, floor: (d) => d.startOf('isoWeek') },
  month: { unit: 'month', step: 1, floor: (d) => d.startOf('month') },
};

function floorToGranularity(d: moment.Moment, g: GranularityRangeValues): moment.Moment {
  return GRANULARITY_CONFIG[g].floor(d);
}

function ceilToGranularity(d: moment.Moment, g: GranularityRangeValues): moment.Moment {
  const { unit, step } = GRANULARITY_CONFIG[g];
  return GRANULARITY_CONFIG[g].floor(d.add(step, unit));
}

function snapCeilToGranularity(d: moment.Moment, g: GranularityRangeValues): moment.Moment {
  const floored = floorToGranularity(d.clone(), g);
  if (floored.isSame(d)) return d.clone();
  return ceilToGranularity(d.clone(), g);
}

function countUnitsBetween(range: TimeRange, g: GranularityRangeValues): number {
  return range.end.diff(range.start, GRANULARITY_CONFIG[g].unit);
}

function countBucketsBetween(range: TimeRange, g: GranularityRangeValues): number {
  return countUnitsBetween(range, g) / GRANULARITY_CONFIG[g].step;
}

function countAlignedBuckets(range: TimeRange, g: GranularityRangeValues): number {
  const alignedStart = floorToGranularity(range.start.clone(), g);
  const alignedEnd = snapCeilToGranularity(range.end.clone(), g);
  return countBucketsBetween({ start: alignedStart, end: alignedEnd }, g);
}

type RangeConfig = {
  baseEnd: (now: moment.Moment, granularity: GranularityRangeValues) => moment.Moment;
  offset: { amount: number; unit: moment.unitOfTime.DurationConstructor };
  start: (end: moment.Moment, granularity: GranularityRangeValues) => moment.Moment;
};

const RANGE_CONFIG: Record<Exclude<TimeRangeValue, 'custom'>, RangeConfig> = {
  realtime: {
    baseEnd: (now) => ceilToGranularity(now, 'minute_1'),
    offset: { amount: 30, unit: 'minutes' },
    start: (end) => end.subtract(30, 'minutes'),
  },
  '1h': {
    baseEnd: (now) => ceilToGranularity(now, 'minute_1'),
    offset: { amount: 1, unit: 'hour' },
    start: (end) => end.subtract(1, 'hour'),
  },
  '24h': {
    baseEnd: (now, g) => ceilToGranularity(now, g),
    offset: { amount: 24, unit: 'hours' },
    start: (end) => end.subtract(24, 'hours'),
  },
  today: {
    baseEnd: (now) => now.add(1, 'day').startOf('day'),
    offset: { amount: 1, unit: 'day' },
    start: (end) => end.subtract(1, 'day'),
  },
  yesterday: {
    baseEnd: (now) => now.startOf('day'),
    offset: { amount: 1, unit: 'day' },
    start: (end) => end.clone().subtract(1, 'day').startOf('day'),
  },
  '7d': {
    baseEnd: (now) => now.startOf('day'),
    offset: { amount: 7, unit: 'days' },
    start: (end) => end.subtract(7, 'days'),
  },
  '28d': {
    baseEnd: (now) => now.startOf('day'),
    offset: { amount: 28, unit: 'days' },
    start: (end) => end.subtract(28, 'days'),
  },
  '90d': {
    baseEnd: (now) => now.startOf('day'),
    offset: { amount: 90, unit: 'days' },
    start: (end) => end.subtract(90, 'days'),
  },
  mtd: {
    baseEnd: (now) => now.add(1, 'day').startOf('day'),
    offset: { amount: 1, unit: 'month' },
    start: (end) => end.clone().subtract(1, 'day').startOf('month'),
  },
  last_month: {
    baseEnd: (now) => now.startOf('month'),
    offset: { amount: 1, unit: 'month' },
    start: (end) => end.subtract(1, 'month'),
  },
  ytd: {
    baseEnd: (now) => now.add(1, 'day').startOf('day'),
    offset: { amount: 1, unit: 'year' },
    start: (end, g) => {
      const s = end.clone().subtract(1, 'day').startOf('year');
      return g === 'week' ? floorToGranularity(s, 'week') : s;
    },
  },
  '1y': {
    baseEnd: (now) => now.add(1, 'day').startOf('day'),
    offset: { amount: 1, unit: 'year' },
    start: (end) => end.subtract(1, 'year'),
  },
};

function getCustomMainRange(timezone: string, offset: number, customStart?: Date, customEnd?: Date): TimeRange {
  const start = floorToGranularity(moment.tz(customStart, timezone), 'day');
  const end = ceilToGranularity(moment.tz(customEnd, timezone), 'day');
  const buckets = countBucketsBetween({ start, end }, 'day');

  return {
    start: start.clone().add(buckets * offset, 'days'),
    end: end.clone().add(buckets * offset, 'days'),
  };
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
    return getCustomMainRange(timezone, offset, customStart, customEnd);
  }

  const config = RANGE_CONFIG[timeRange];
  const now = moment.tz(timezone);

  const baseEnd = config.baseEnd(now.clone(), granularity);
  const rangeEnd = baseEnd.clone().add(config.offset.amount * offset, config.offset.unit);
  const rangeStart = config.start(rangeEnd.clone(), granularity);

  return { start: rangeStart, end: rangeEnd };
}

function alignWeekday(
  mainEnd: moment.Moment,
  compareEnd: moment.Moment,
  mode: 'previous' | 'year',
): moment.Moment {
  const mainWeekday = mainEnd.isoWeekday();
  const compareWeekday = compareEnd.isoWeekday();
  const forwardDelta = (mainWeekday - compareWeekday + 7) % 7;
  const backwardDelta = (compareWeekday - mainWeekday + 7) % 7;

  if (forwardDelta === 0) return compareEnd.clone();
  if (mode === 'previous') return compareEnd.clone().subtract(backwardDelta, 'days');
  return compareEnd.clone().add(forwardDelta, 'days');
}

function computeFineCompare(
  range: TimeRange,
  mode: CompareMode,
  granularity: GranularityRangeValues,
  shouldAlignWeekdays?: boolean,
  customCompareRange?: TimeRange,
): TimeRange | undefined {
  const diff = countUnitsBetween(range, granularity);
  const { unit } = GRANULARITY_CONFIG[granularity];

  if (mode === 'custom' && customCompareRange) {
    const alignedStart = customCompareRange.start.clone().set({
      hour: range.start.hour(),
      minute: range.start.minute(),
      second: range.start.second(),
      millisecond: range.start.millisecond(),
    });
    return {
      start: alignedStart.clone(),
      end: alignedStart.clone().add(diff, unit),
    };
  }

  if (mode === 'previous') {
    const compareEnd = shouldAlignWeekdays
      ? alignWeekday(range.end, range.start, 'previous')
      : range.start.clone();
    return {
      start: compareEnd.clone().subtract(diff, unit),
      end: compareEnd,
    };
  }

  if (mode === 'year') {
    const rawEnd = range.end.clone().subtract(1, 'year');
    const compareEnd = shouldAlignWeekdays ? alignWeekday(range.end, rawEnd, 'year') : rawEnd;
    return {
      start: compareEnd.clone().subtract(diff, unit),
      end: compareEnd,
    };
  }

  return undefined;
}

function computeCoarseCompare(
  range: TimeRange,
  mode: CompareMode,
  granularity: 'week' | 'month',
  shouldAlignWeekdays?: boolean,
  customCompareRange?: TimeRange,
): TimeRange | undefined {
  const { unit } = GRANULARITY_CONFIG[granularity];
  const alignedStart = floorToGranularity(range.start.clone(), granularity);
  const alignedEnd = snapCeilToGranularity(range.end.clone(), granularity);
  const buckets = alignedEnd.diff(alignedStart, unit);

  if (mode === 'custom' && customCompareRange) {
    const customStart = customCompareRange.start.clone().set({
      hour: range.start.hour(),
      minute: range.start.minute(),
      second: range.start.second(),
      millisecond: range.start.millisecond(),
    });
    const alignedCustomStart = floorToGranularity(customStart.clone(), granularity);
    return {
      start: customStart,
      end: alignedCustomStart.clone().add(buckets, unit),
    };
  }

  if (granularity === 'week') {
    const daySpan = range.end.diff(range.start, 'days');

    if (mode === 'previous' || mode === 'year') {
      let compareEnd: moment.Moment;
      if (mode === 'previous') {
        compareEnd = shouldAlignWeekdays
          ? alignWeekday(range.end, range.start, 'previous')
          : range.start.clone();
      } else {
        const rawEnd = range.end.clone().subtract(1, 'year');
        compareEnd = shouldAlignWeekdays ? alignWeekday(range.end, rawEnd, 'year') : rawEnd;
      }

      let compareStart = compareEnd.clone().subtract(daySpan, 'days');

      const mainBuckets = countAlignedBuckets(range, 'week');
      const compareBuckets = countAlignedBuckets({ start: compareStart, end: compareEnd }, 'week');

      if (mainBuckets !== compareBuckets) {
        const shift = (compareStart.isoWeekday() - range.start.isoWeekday() + 7) % 7;
        compareStart = compareStart.clone().subtract(shift, 'days');
        compareEnd = compareEnd.clone().subtract(shift, 'days');
      }

      return { start: compareStart, end: compareEnd };
    }
  }

  if (mode === 'previous') {
    const compareEnd = shouldAlignWeekdays
      ? alignWeekday(range.end, range.start, 'previous')
      : range.start.clone();
    const alignedCompareEnd = snapCeilToGranularity(compareEnd.clone(), granularity);
    return {
      start: alignedCompareEnd.clone().subtract(buckets, unit),
      end: compareEnd,
    };
  }

  if (mode === 'year') {
    const rawEnd = range.end.clone().subtract(1, 'year');
    const compareEnd = shouldAlignWeekdays ? alignWeekday(range.end, rawEnd, 'year') : rawEnd;
    const alignedCompareEnd = snapCeilToGranularity(compareEnd.clone(), granularity);
    return {
      start: alignedCompareEnd.clone().subtract(buckets, unit),
      end: compareEnd,
    };
  }

  return undefined;
}

function getCompareRange(
  range: TimeRange,
  mode: CompareMode,
  granularity: GranularityRangeValues,
  shouldAlignWeekdays?: boolean,
  customCompareRange?: TimeRange,
): TimeRange | undefined {
  if (mode === 'off') return undefined;

  const isCoarse = granularity === 'week' || granularity === 'month';
  if (isCoarse) {
    return computeCoarseCompare(range, mode, granularity, shouldAlignWeekdays, customCompareRange);
  }
  return computeFineCompare(range, mode, granularity, shouldAlignWeekdays, customCompareRange);
}

export function isStartBucketIncomplete(
  startDate: Date,
  granularity: GranularityRangeValues,
  timezone: string,
): boolean {
  const start = moment.tz(startDate, timezone);
  if (granularity === 'week') return start.isoWeekday() !== 1;
  if (granularity === 'month') return start.date() !== 1;
  return false;
}

export function isEndBucketIncomplete(
  endDate: Date,
  granularity: GranularityRangeValues,
  timezone: string,
): boolean {
  const end = moment.tz(endDate, timezone);
  if (granularity === 'week') return end.isoWeekday() !== 7;
  if (granularity === 'month') return end.date() !== end.daysInMonth();
  return false;
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
  const resolve = (g: GranularityRangeValues, cs?: Date, ce?: Date) => {
    const mainRange = getMainRange(timeRange, g, timezone, offset, cs, ce);
    const customCompareRange =
      compareStartDate && compareEndDate
        ? {
            start: floorToGranularity(moment.tz(compareStartDate, timezone), 'day'),
            end: ceilToGranularity(moment.tz(compareEndDate, timezone), 'day'),
          }
        : undefined;
    const compareRange = getCompareRange(mainRange, compareMode, g, compareAlignWeekdays, customCompareRange);
    return { mainRange, compareRange };
  };

  const initial = resolve(granularity, startDate, endDate);
  let mainEnd = initial.mainRange.end.toDate();
  const mainStart = initial.mainRange.start.toDate();
  let nextGranularity = granularity;

  const maxMs = 366 * 24 * 60 * 60 * 1000;
  if (mainEnd.getTime() - mainStart.getTime() > maxMs) {
    mainEnd = new Date(mainStart.getTime() + maxMs);
  }

  const allowed = getAllowedGranularities(mainStart, mainEnd);
  nextGranularity = getValidGranularityFallback(nextGranularity, allowed);

  const needsRecompute =
    mainEnd.getTime() !== initial.mainRange.end.toDate().getTime() || nextGranularity !== granularity;

  const { mainRange, compareRange } = needsRecompute ? resolve(nextGranularity, mainStart, mainEnd) : initial;

  return {
    main: { start: mainRange.start.toDate(), end: mainRange.end.clone().subtract(1, 'second').toDate() },
    compare: compareRange
      ? { start: compareRange.start.toDate(), end: compareRange.end.clone().subtract(1, 'second').toDate() }
      : undefined,
    granularity: nextGranularity,
    startBucketIncomplete: isStartBucketIncomplete(mainRange.start.toDate(), nextGranularity, timezone),
  };
}

export function isNowInFirstBucket(result: TimeRangeResult, timezone: string): boolean {
  const now = moment.tz(Date.now(), timezone);
  const start = moment.tz(result.main.start, timezone);
  const bucketGranularity = getAllowedGranularities(result.main.start, result.main.end)[0];
  return countBucketsBetween({ start, end: now }, bucketGranularity) < 1;
}
