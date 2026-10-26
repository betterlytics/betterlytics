import { getResolvedRanges } from '@/lib/ba-timerange';
import { toDateTimeString } from '@/utils/dateFormatters';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { TimeRangeValue } from '@/utils/timeRanges';
import { parseDayKey } from '@/utils/timezone';

type ResolveTimeRangeInput = {
  timeRange: TimeRangeValue;
  startDate?: string;
  endDate?: string;
  timezone: string;
  granularity?: GranularityRangeValues;
};

export type ResolvedTimeRange = {
  startDateTime: string;
  endDateTime: string;
  start: Date;
  end: Date;
  granularity: GranularityRangeValues;
};

export function resolveTimeRange(input: ResolveTimeRangeInput): ResolvedTimeRange {
  const { timezone } = input;
  const customStart = input.startDate ? parseDayKey(input.startDate, timezone) : new Date();
  const customEnd = input.endDate ? parseDayKey(input.endDate, timezone) : new Date();

  const ranges = getResolvedRanges(
    input.timeRange,
    'off',
    timezone,
    customStart,
    customEnd,
    input.granularity ?? 'day',
    undefined,
    undefined,
    0,
    false,
  );

  return {
    startDateTime: toDateTimeString(ranges.main.start),
    endDateTime: toDateTimeString(ranges.main.end),
    start: ranges.main.start,
    end: ranges.main.end,
    granularity: ranges.granularity,
  };
}
