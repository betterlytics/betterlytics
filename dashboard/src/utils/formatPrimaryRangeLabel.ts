import { TimeRangeValue } from '@/utils/timeRanges';
import { SupportedLanguages } from '@/constants/i18n';
import { createDateTimeFormat, zonedMoment } from '@/utils/timezone';

interface FormatPrimaryRangeLabelParams {
  interval: TimeRangeValue;
  offset: number;
  startDate: Date;
  endDate: Date;
  locale: SupportedLanguages;
  timeZone?: string;
}

export function formatPrimaryRangeLabel({
  interval,
  offset,
  startDate,
  endDate,
  locale,
  timeZone,
}: FormatPrimaryRangeLabelParams): string {
  const dateFormatter = createDateTimeFormat(locale, { month: 'short', day: 'numeric' }, timeZone);
  const dateTimeFormatter = createDateTimeFormat(
    locale,
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    timeZone,
  );
  const timeFormatter = createDateTimeFormat(
    locale,
    { hour: '2-digit', minute: '2-digit', hour12: false },
    timeZone,
  );

  const start = zonedMoment(startDate, timeZone);
  const end = zonedMoment(endDate, timeZone);

  const isSameDay = start.isSame(end, 'day');

  const isStartMidnight = start.hour() === 0 && start.minute() === 0;
  const isEndEndOfDay = end.hour() === 23 && end.minute() >= 59; // tolerate seconds/millis
  const isFullDayRange = isStartMidnight && isEndEndOfDay;

  if (isFullDayRange) {
    if (isSameDay) return dateFormatter.format(startDate);
    return `${dateFormatter.format(startDate)} - ${dateFormatter.format(endDate)}`;
  }

  // Adjust displayed end time forward to the next minute if the end contains seconds/millis
  const displayEnd =
    end.second() > 0 || end.millisecond() > 0 ? end.clone().startOf('minute').add(1, 'minute') : end;

  const isSameDayForDisplay = start.isSame(displayEnd, 'day');

  if (isSameDayForDisplay) {
    return `${dateFormatter.format(startDate)} ${timeFormatter.format(startDate)} - ${timeFormatter.format(
      displayEnd.toDate(),
    )}`;
  }

  return `${dateTimeFormatter.format(startDate)} - ${dateTimeFormatter.format(displayEnd.toDate())}`;
}
