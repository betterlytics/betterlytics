import { TIME_RANGE_PRESETS, TimeRangeValue } from '@/utils/timeRanges';

interface FormatPrimaryRangeLabelParams {
  interval: TimeRangeValue;
  offset: number;
  startDate: Date;
  endDate: Date;
}

export function formatPrimaryRangeLabel({
  interval,
  offset,
  startDate,
  endDate,
}: FormatPrimaryRangeLabelParams): string {
  const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const dateTimeOpts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const isStartMidnight = startDate.getHours() === 0 && startDate.getMinutes() === 0;
  const isEndEndOfDay = endDate.getHours() === 23 && endDate.getMinutes() >= 59; // tolerate seconds/millis
  const isFullDayRange = isStartMidnight && isEndEndOfDay;

  if (interval !== 'custom' && offset === 0) {
    const preset = TIME_RANGE_PRESETS.find((p) => p.value === interval);
    return preset?.label ?? interval;
  }

  if (isFullDayRange) {
    if (isSameDay) return startDate.toLocaleDateString(undefined, dateOpts);
    return `${startDate.toLocaleDateString(undefined, dateOpts)} - ${endDate.toLocaleDateString(undefined, dateOpts)}`;
  }

  // Adjust displayed end time forward to the next minute if the end contains seconds/millis
  const displayEnd = (() => {
    if (endDate.getSeconds() > 0 || endDate.getMilliseconds() > 0) {
      const d = new Date(endDate);
      d.setSeconds(0, 0);
      d.setMinutes(d.getMinutes() + 1);
      return d;
    }
    return endDate;
  })();

  const isSameDayForDisplay =
    startDate.getFullYear() === displayEnd.getFullYear() &&
    startDate.getMonth() === displayEnd.getMonth() &&
    startDate.getDate() === displayEnd.getDate();

  if (isSameDayForDisplay) {
    return `${startDate.toLocaleDateString(undefined, dateOpts)} ${startDate.toLocaleTimeString(
      undefined,
      timeOpts,
    )} - ${displayEnd.toLocaleTimeString(undefined, timeOpts)}`;
  }

  return `${startDate.toLocaleString(undefined, dateTimeOpts)} - ${displayEnd.toLocaleString(
    undefined,
    dateTimeOpts,
  )}`;
}
