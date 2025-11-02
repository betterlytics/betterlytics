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
  offset?: number,
): TimeRangeResult {
  const main = getAlignedRange({ timeRange, timezone, startDate, endDate, granularity, offset });

  const compare = getCompareAlignedRange({
    compareMode,
    timezone,
    granularity,
    main,
    compareStart: startDate,
    compareEnd: endDate,
  });

  return { main, compare };
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

  const snapped = (() => {
    // Only these include the current bucket
    const includeCurrent = ['realtime', '1h', '24h', 'today', 'mtd', 'ytd'].includes(timeRange);

    // Fixed-duration trailing windows; derive start from end
    const durationSpec =
      timeRange === 'realtime'
        ? { amount: 30, unit: 'minute' as const }
        : timeRange === '1h'
          ? { amount: 1, unit: 'hour' as const }
          : timeRange === '24h'
            ? { amount: 24, unit: 'hour' as const }
            : null;

    const unit = getGranularityUnit(granularity);
    const step = getGranularityStep(granularity);

    // If including current bucket, move end to next bucket start (end stays exclusive)
    const endForWindow = moment(initiallySnapped.end)
      .tz(timezone)
      .add(includeCurrent ? step : 0, unit)
      .toDate();

    if (durationSpec) {
      const derivedStart = moment(endForWindow)
        .tz(timezone)
        .subtract(durationSpec.amount, durationSpec.unit)
        .toDate();
      return snapToGranularity({ start: derivedStart, end: endForWindow, granularity, timezone });
    }

    // Calendar-anchored (today/mtd/ytd): keep start anchored, only shift end when including current bucket
    if (includeCurrent) {
      return snapToGranularity({ start: initiallySnapped.start, end: endForWindow, granularity, timezone });
    }

    // All others unchanged
    return initiallySnapped;
  })();

  if (offset === 0) return snapped;

  const duration = snapped.end.getTime() - snapped.start.getTime();

  return {
    start: new Date(snapped.start.getTime() + offset * duration),
    end: new Date(snapped.end.getTime() + offset * duration),
  };
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
}: {
  compareMode: CompareMode;
  timezone: string;
  granularity: GranularityRangeValues;
  main: ResolvedRange;
  compareStart?: Date;
  compareEnd?: Date;
}): ResolvedRange | undefined {
  if (compareMode === 'off') return undefined;

  const duration = main.end.getTime() - main.start.getTime();

  if (compareMode === 'previous') {
    const start = new Date(main.start.getTime() - duration);
    const end = new Date(main.end.getTime() - duration);
    return snapToGranularity({ start, end, granularity, timezone });
  }

  if (compareMode === 'year') {
    const start = moment(main.start).tz(timezone).subtract(1, 'year').toDate();
    const end = moment(main.end).tz(timezone).subtract(1, 'year').toDate();
    return snapToGranularity({ start, end, granularity, timezone });
  }

  if (compareMode === 'custom' && compareStart && compareEnd) {
    return snapToGranularity({
      start: moment(compareStart).tz(timezone).toDate(),
      end: moment(compareEnd).tz(timezone).toDate(),
      granularity,
      timezone,
    });
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
  const unit = getGranularityUnit(granularity);
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
 * Map granularity → moment units
 */
function getGranularityUnit(g: GranularityRangeValues) {
  if (g.startsWith('minute')) return 'minute';
  if (g === 'hour') return 'hour';
  return 'day';
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
      return moment(endDate).tz(timezone).endOf('day');
    case 'realtime':
    case '1h':
    case '24h':
      return now.endOf('minute');
    case 'today':
      return now.endOf('day');
    case 'yesterday':
      return now.subtract(1, 'day').endOf('day');
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
