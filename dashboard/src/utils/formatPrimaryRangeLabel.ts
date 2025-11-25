import { TimeRangeValue } from '@/utils/timeRanges';
import { SupportedLanguages } from '@/constants/i18n';

interface FormatPrimaryRangeLabelParams {
  interval: TimeRangeValue;
  offset: number;
  startDate: Date;
  endDate: Date;
  locale: SupportedLanguages;
}

export function formatPrimaryRangeLabel({
  interval,
  offset,
  startDate,
  endDate,
  locale,
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

  if (isFullDayRange) {
    if (isSameDay) return startDate.toLocaleDateString(locale, dateOpts);
    return `${startDate.toLocaleDateString(locale, dateOpts)} - ${endDate.toLocaleDateString(locale, dateOpts)}`;
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
    return `${startDate.toLocaleDateString(locale, dateOpts)} ${startDate.toLocaleTimeString(
      locale,
      timeOpts,
    )} - ${displayEnd.toLocaleTimeString(locale, timeOpts)}`;
  }

  return `${startDate.toLocaleString(locale, dateTimeOpts)} - ${displayEnd.toLocaleString(
    locale,
    dateTimeOpts,
  )}`;
}
