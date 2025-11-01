'server only';

import moment from 'moment-timezone';
import { TimeRangeValue } from '@/utils/timeRanges';

export function getTimeRange(
  timeRange: TimeRangeValue,
  timezone: string,
  startDate: Date,
  endDate: Date,
  offset?: number,
) {
  const baseStart = getStartTime(timeRange, timezone, startDate, endDate);
  const baseEnd = getEndTime(timeRange, timezone, endDate);

  if (offset === undefined || offset === 0) {
    return {
      start: baseStart.toDate(),
      end: baseEnd.toDate(),
    };
  }

  const duration = baseEnd.diff(baseStart);

  return {
    start: baseStart.add(offset * duration).toDate(),
    end: baseEnd.add(offset * duration).toDate(),
  };
}

function getEndTime(timeRange: TimeRangeValue, timezone: string, endDate: Date) {
  const now = moment().tz(timezone);
  switch (timeRange) {
    case 'custom':
      return moment(endDate).tz(timezone).endOf('day');
    case 'realtime':
    case '1h':
    case '24h':
      return now;
    case 'today':
      return now.endOf('day');
    case 'yesterday':
    case '7d':
    case '28d':
    case '90d':
      return now.subtract(1, 'day').endOf('day');
    case 'mtd':
      return now.endOf('day');
    case 'last_month':
      return now.subtract(1, 'month').endOf('month');
    case 'ytd':
      return now.endOf('day');
    case '1y':
      return now.endOf('day');
  }
}

function getStartTime(timeRange: TimeRangeValue, timezone: string, startDate: Date, endDate: Date) {
  const end = getEndTime(timeRange, timezone, endDate).clone();
  switch (timeRange) {
    case 'custom':
      return moment(startDate).tz(timezone).startOf('day');
    case 'realtime':
      return end.subtract(30, 'minutes');
    case '1h':
      return end.subtract(1, 'hour');
    case '24h':
      return end.subtract(1, 'day');
    case 'today':
      return end.startOf('day');
    case 'yesterday':
      return end.startOf('day');
    case '7d':
      return end.subtract(7, 'days').startOf('day');
    case '28d':
      return end.subtract(28, 'days').startOf('day');
    case '90d':
      return end.subtract(90, 'days').startOf('day');
    case 'mtd':
      return end.startOf('month');
    case 'last_month':
      return end.startOf('month');
    case 'ytd':
      return end.startOf('year');
    case '1y':
      return end.subtract(1, 'year');
  }
}

// function getEndTimestamp() {
//   const now = safeSql`now(${SQL.String({ timezone })})`;
//   switch (timeRange) {
//     case 'realtime':
//     case '1h':
//       return now;
//     case '24h':
//       return safeSql`toStartOfHour(addHours(${now}, 1))`;
//     case 'today':
//       return safeSql`toStartOfDay(addDays(${now}, 1))`;
//     case 'yesterday':
//       return safeSql`toStartOfDay(${now})`;
//     case '7d':
//     case '28d':
//     case '90d':
//       return safeSql`toStartOfDay(${now})`;
//     case 'mtd':
//       return safeSql`toStartOfDay(addDays(${now}, 1))`;
//     case 'last_month':
//       return safeSql`toStartOfMonth(${now})`;
//     case 'ytd':
//       return safeSql`toStartOfDay(addDays(${now}, 1))`;
//     case '1y':
//       return safeSql`toStartOfDay(${now})`;
//     default:
//       return now;
//   }
// }

// function getStartTimestamp() {
//   const end = getEndTimestamp();
//   switch (timeRange) {
//     case 'realtime':
//       return safeSql`subtractMinutes(${end}, 30)`;
//     case '1h':
//       return safeSql`subtractHours(${end}, 1)`;
//     case '24h':
//       return safeSql`subtractDays(${end}, 1)`;
//     case 'today':
//       return safeSql`toStartOfDay(subtractDays(${end}, 1))`;
//     case 'yesterday':
//       return safeSql`subtractDays(${end}, 1)`;
//     case '7d':
//       return safeSql`subtractDays(${end}, 7)`;
//     case '28d':
//       return safeSql`subtractDays(${end}, 28)`;
//     case '90d':
//       return safeSql`subtractDays(${end}, 90)`;
//     case 'mtd':
//       return safeSql`toStartOfMonth(${end})`;
//     case 'last_month':
//       return safeSql`subtractMonths(${end}, 1)`;
//     case 'ytd':
//       return safeSql`toStartOfYear(${end})`;
//     case '1y':
//       return safeSql`subtractYears(${end}, 1)`;
//     default:
//       return end;
//   }
// }
