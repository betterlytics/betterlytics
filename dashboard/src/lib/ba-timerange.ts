'server-only';

import moment from 'moment-timezone';
import { TimeRangeValue } from '@/utils/timeRanges';
import { CompareMode } from '@/utils/compareRanges';
import { GranularityRangeValues } from '@/utils/granularityRanges';
interface ResolvedRange {
  start: Date;
  end: Date;
}

interface TimeRangeResult {
  main: ResolvedRange;
  compare?: ResolvedRange;
}

/**
 * Generate both main and compare ranges, aligned to timezone and granularity.
 */
export function getResolvedRanges(
  timeRange: TimeRangeValue,
  compareMode: CompareMode,
  timezone: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  compareStartDate?: Date,
  compareEndDate?: Date,
  offset?: number,
  compareAlignWeekdays?: boolean,
): TimeRangeResult {
  const main = getAlignedRange({ timeRange, timezone, startDate, endDate, granularity, offset });

  const compare = getCompareAlignedRange({
    compareMode,
    timezone,
    granularity,
    main,
    compareStart: compareStartDate,
    compareEnd: compareEndDate,
    compareAlignWeekdays,
  });

  return { main, compare };
}

function shouldIncludeCurrentBucket(timeRange: TimeRangeValue) {
  return (
    timeRange === 'realtime' ||
    timeRange === '1h' ||
    timeRange === '24h' ||
    timeRange === 'today' ||
    timeRange === 'mtd' ||
    timeRange === 'last_month' ||
    timeRange === 'ytd'
  );
}

type DurationSpecUnit = 'minute' | 'hour';
interface DurationSpec {
  amount: number;
  unit: DurationSpecUnit;
}

function getTrailingDurationSpec(timeRange: TimeRangeValue): DurationSpec | null {
  switch (timeRange) {
    case 'realtime':
      return { amount: 30, unit: 'minute' };
    case '1h':
      return { amount: 1, unit: 'hour' };
    case '24h':
      return { amount: 24, unit: 'hour' };
    default:
      return null;
  }
}

function moveEndToNextBucket(end: Date, granularity: GranularityRangeValues, timezone: string) {
  const unit = getMomentGranularityUnit(granularity);
  const step = getGranularityStep(granularity);
  return moment(end).tz(timezone).add(step, unit).toDate();
}

function getCalendarDaySpan(mainStart: Date, mainEnd: Date, timezone: string) {
  const s = moment.tz(mainStart, timezone).startOf('day');
  const e = moment.tz(mainEnd, timezone).startOf('day');
  return e.diff(s, 'day');
}

function alignWeekday(
  start: Date,
  end: Date,
  mainStart: Date,
  timezone: string,
  mode: 'previous' | 'year',
  enabled?: boolean,
) {
  if (!enabled) return { start, end };
  const mainStartDay = moment.tz(mainStart, timezone).startOf('day');
  const compareStartDay = moment.tz(start, timezone).startOf('day');

  if (mode === 'previous') {
    const shiftBackDays = (compareStartDay.day() - mainStartDay.day() + 7) % 7;
    if (shiftBackDays === 0) return { start, end };
    return {
      start: moment.tz(start, timezone).subtract(shiftBackDays, 'day').toDate(),
      end: moment.tz(end, timezone).subtract(shiftBackDays, 'day').toDate(),
    };
  }

  const delta = (mainStartDay.day() - compareStartDay.day() + 7) % 7;
  if (delta === 0) return { start, end };
  return {
    start: moment.tz(start, timezone).add(delta, 'day').toDate(),
    end: moment.tz(end, timezone).add(delta, 'day').toDate(),
  };
}

function buildPreviousRange(
  main: ResolvedRange,
  granularity: GranularityRangeValues,
  timezone: string,
  compareAlignWeekdays?: boolean,
) {
  const unit = getMomentGranularityUnit(granularity);

  if (unit === 'day') {
    const days = getCalendarDaySpan(main.start, main.end, timezone);
    const end = moment.tz(main.start, timezone).toDate();
    const start = moment.tz(end, timezone).subtract(days, 'day').toDate();
    return alignWeekday(start, end, main.start, timezone, 'previous', compareAlignWeekdays);
  }

  const durationMs = main.end.getTime() - main.start.getTime();
  const start = new Date(main.start.getTime() - durationMs);
  const end = new Date(main.end.getTime() - durationMs);
  return alignWeekday(start, end, main.start, timezone, 'previous', compareAlignWeekdays);
}

function buildYearRange(
  main: ResolvedRange,
  granularity: GranularityRangeValues,
  timezone: string,
  compareAlignWeekdays?: boolean,
) {
  const unit = getMomentGranularityUnit(granularity);

  if (unit === 'day') {
    const start = moment.tz(main.start, timezone).subtract(1, 'year').toDate();
    const end = moment.tz(main.end, timezone).subtract(1, 'year').toDate();
    return alignWeekday(start, end, main.start, timezone, 'year', compareAlignWeekdays);
  }

  const durationMs = main.end.getTime() - main.start.getTime();
  const end = moment.tz(main.end, timezone).subtract(1, 'year').toDate();
  const start = new Date(end.getTime() - durationMs);
  return alignWeekday(start, end, main.start, timezone, 'year', compareAlignWeekdays);
}

function getBucketCountOverRange(start: Date, end: Date, granularity: GranularityRangeValues, timezone: string) {
  const unit = getMomentGranularityUnit(granularity);
  const step = getGranularityStep(granularity);
  const s = moment.tz(start, timezone);
  const e = moment.tz(end, timezone);
  if (unit === 'minute') {
    const minutes = e.diff(s, 'minute');
    return Math.floor(minutes / step);
  }
  if (unit === 'hour') return e.diff(s, 'hour');
  return e.diff(s, 'day');
}

function adjustEndToMatchMainBucketCount(
  main: ResolvedRange,
  start: Date,
  end: Date,
  granularity: GranularityRangeValues,
  timezone: string,
) {
  const unit = getMomentGranularityUnit(granularity);
  const step = getGranularityStep(granularity);
  const mainBuckets = getBucketCountOverRange(main.start, main.end, granularity, timezone);
  const snappedCompare = snapToGranularity({ start, end, granularity, timezone });
  const compareBuckets = getBucketCountOverRange(snappedCompare.start, snappedCompare.end, granularity, timezone);
  const deltaBuckets = mainBuckets - compareBuckets;
  if (deltaBuckets === 0) return end;
  return moment
    .tz(end, timezone)
    .add(deltaBuckets * step, unit)
    .toDate();
}

/**
 * Computes aligned start/end for a time range.
 */
function getAlignedRange({
  timeRange,
  timezone,
  startDate,
  endDate,
  granularity,
  offset = 0,
}: {
  timeRange: TimeRangeValue;
  timezone: string;
  startDate: Date;
  endDate: Date;
  granularity: GranularityRangeValues;
  offset?: number;
}): ResolvedRange {
  const rawStart = getStartTime(timeRange, timezone, startDate).toDate();
  const rawEnd = getEndTime(timeRange, timezone, endDate).toDate();

  // Initial snap
  const initiallySnapped = snapToGranularity({ start: rawStart, end: rawEnd, granularity, timezone });

  const includeCurrent = shouldIncludeCurrentBucket(timeRange);
  const endForWindow = includeCurrent
    ? moveEndToNextBucket(initiallySnapped.end, granularity, timezone)
    : initiallySnapped.end;

  const durationSpec = getTrailingDurationSpec(timeRange);

  let snapped: ResolvedRange;

  if (durationSpec) {
    const derivedStart = moment(endForWindow)
      .tz(timezone)
      .subtract(durationSpec.amount, durationSpec.unit)
      .toDate();
    snapped = snapToGranularity({ start: derivedStart, end: endForWindow, granularity, timezone });
  } else if (includeCurrent) {
    snapped = snapToGranularity({ start: initiallySnapped.start, end: endForWindow, granularity, timezone });
  } else {
    snapped = initiallySnapped;
  }

  if (offset === 0) return snapped;
  const unit = getMomentGranularityUnit(granularity);
  const step = getGranularityStep(granularity);
  const bucketCount = getBucketCountOverRange(snapped.start, snapped.end, granularity, timezone);
  const shiftBuckets = offset * bucketCount * step;

  const startShifted = moment.tz(snapped.start, timezone).add(shiftBuckets, unit).toDate();
  const endShifted = moment.tz(snapped.end, timezone).add(shiftBuckets, unit).toDate();

  return { start: startShifted, end: endShifted };
}

/**
 * Generates a compare range aligned to the main range.
 */
function getCompareAlignedRange({
  compareMode,
  timezone,
  granularity,
  main,
  compareStart,
  compareEnd,
  compareAlignWeekdays,
}: {
  compareMode: CompareMode;
  timezone: string;
  granularity: GranularityRangeValues;
  main: ResolvedRange;
  compareStart?: Date;
  compareEnd?: Date;
  compareAlignWeekdays?: boolean;
}): ResolvedRange | undefined {
  if (compareMode === 'off') return undefined;

  if (compareMode === 'custom' && compareStart && compareEnd) {
    const start = moment(compareStart).tz(timezone).startOf('day').toDate();
    const end = moment(compareEnd).tz(timezone).add(1, 'day').startOf('day').toDate();
    const endAdjusted = adjustEndToMatchMainBucketCount(main, start, end, granularity, timezone);
    return snapToGranularity({ start, end: endAdjusted, granularity, timezone });
  }

  if (compareMode === 'previous') {
    const { start, end } = buildPreviousRange(main, granularity, timezone, compareAlignWeekdays);
    const endAdjusted = adjustEndToMatchMainBucketCount(main, start, end, granularity, timezone);
    return snapToGranularity({ start, end: endAdjusted, granularity, timezone });
  }

  if (compareMode === 'year') {
    const { start, end } = buildYearRange(main, granularity, timezone, compareAlignWeekdays);
    const endAdjusted = adjustEndToMatchMainBucketCount(main, start, end, granularity, timezone);
    return snapToGranularity({ start, end: endAdjusted, granularity, timezone });
  }

  return undefined;
}

/**
 * Snap start/end to the nearest granularity in timezone context.
 */
function snapToGranularity({
  start,
  end,
  granularity,
  timezone,
}: {
  start: Date;
  end: Date;
  granularity: GranularityRangeValues;
  timezone: string;
}): ResolvedRange {
  const unit = getMomentGranularityUnit(granularity);
  const step = getGranularityStep(granularity);

  const startTz = moment.tz(start, timezone).startOf(unit);
  const endTz = moment.tz(end, timezone).startOf(unit);

  // Handle multi-minute granularities (15, 30)
  if (unit === 'minute' && step > 1) {
    const startMinutes = startTz.minute();
    const alignedStart = startTz
      .clone()
      .minute(Math.floor(startMinutes / step) * step)
      .second(0)
      .millisecond(0);

    const endMinutes = endTz.minute();
    const alignedEnd = endTz
      .clone()
      .minute(Math.floor(endMinutes / step) * step)
      .second(0)
      .millisecond(0);

    return { start: alignedStart.toDate(), end: alignedEnd.toDate() };
  }

  return { start: startTz.toDate(), end: endTz.toDate() };
}

/**
 * Map granularity -> moment units
 */
function getMomentGranularityUnit(g: GranularityRangeValues) {
  if (g === 'day') return 'day';
  if (g === 'hour') return 'hour';
  if (g === 'minute_1') return 'minute';
  if (g === 'minute_15') return 'minute';
  if (g === 'minute_30') return 'minute';
  throw new Error(`Invalid granularity: ${g}`);
}

function getGranularityStep(g: GranularityRangeValues) {
  if (g === 'minute_1') return 1;
  if (g === 'minute_15') return 15;
  if (g === 'minute_30') return 30;
  if (g === 'hour') return 1;
  if (g === 'day') return 1;
  return 1;
}

function getStartTime(timeRange: TimeRangeValue, timezone: string, startDate: Date) {
  const now = moment().tz(timezone);
  switch (timeRange) {
    case 'custom':
      return moment(startDate).tz(timezone).startOf('day');
    case 'realtime':
      return now.subtract(30, 'minutes');
    case '1h':
      return now.subtract(1, 'hour');
    case '24h':
      return now.subtract(1, 'day');
    case 'today':
      return now.startOf('day');
    case 'yesterday':
      return now.subtract(1, 'day').startOf('day');
    case '7d':
      return now.subtract(7, 'days').startOf('day');
    case '28d':
      return now.subtract(28, 'days').startOf('day');
    case '90d':
      return now.subtract(90, 'days').startOf('day');
    case 'mtd':
      return now.startOf('month');
    case 'last_month':
      return now.subtract(1, 'month').startOf('month');
    case 'ytd':
      return now.startOf('year');
    case '1y':
      return now.subtract(1, 'year');
  }
}

function getEndTime(timeRange: TimeRangeValue, timezone: string, endDate: Date) {
  const now = moment().tz(timezone);
  switch (timeRange) {
    case 'custom':
      return moment(endDate).tz(timezone).add(1, 'day').startOf('day');
    case 'realtime':
    case '1h':
    case '24h':
      return now.endOf('minute');
    case 'today':
      return now.endOf('day');
    case 'yesterday':
      return now.startOf('day');
    case '7d':
    case '28d':
    case '90d':
    case 'mtd':
    case 'ytd':
    case '1y':
      return now.endOf('day');
    case 'last_month':
      return now.subtract(1, 'month').endOf('month');
  }
}
