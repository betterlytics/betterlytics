import { getResolvedRanges } from '@/lib/ba-timerange';
import { toDateTimeString } from '@/utils/dateFormatters';
import { TimeRangeValue } from '@/utils/timeRanges';

type ResolveTimeRangeInput = {
  timeRange: TimeRangeValue;
  startDate?: string;
  endDate?: string;
  timezone?: string;
};

type ResolvedTimeRange = {
  startDateTime: string;
  endDateTime: string;
  start: Date;
  end: Date;
};

export function resolveTimeRange(input: ResolveTimeRangeInput): ResolvedTimeRange {
  const timezone = input.timezone ?? 'UTC';
  const customStart = input.startDate ? new Date(input.startDate) : new Date();
  const customEnd = input.endDate ? new Date(input.endDate) : new Date();

  const ranges = getResolvedRanges(
    input.timeRange,
    'off',
    timezone,
    customStart,
    customEnd,
    'day',
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
  };
}
