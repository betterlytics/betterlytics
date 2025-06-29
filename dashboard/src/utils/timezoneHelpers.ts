import { startOfDay, endOfDay, startOfHour, endOfHour, startOfMinute, endOfMinute } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { GranularityRangeValues } from './granularityRanges';
import { Branded } from './brand';

export type UTCDate = Branded<Date, 'UTCDate'>;
export type TZDate = Branded<Date, 'TZDate'>;

/**
 * Timezone-aware date utilities for handling the conversion between user timezone / UTC
 */
export class TimezoneAwareDateHelper {
  constructor(private userTimezone: string = 'UTC') {}

  /**
   * UTC --> User time
   */
  toUserTimezone(utcDate: UTCDate): TZDate {
    return toZonedTime(utcDate, this.userTimezone) as TZDate;
  }

  /**
   * User time --> UTC
   */
  toUTC(userDate: TZDate): UTCDate {
    return fromZonedTime(userDate, this.userTimezone) as UTCDate;
  }

  // Start / end of granularity of user timezone, returned as UTC
  startOfDayInUserTimezone(date: UTCDate): UTCDate {
    const userDate = this.toUserTimezone(date);
    const startOfUserDay = startOfDay(userDate);
    return this.toUTC(startOfUserDay);
  }

  endOfDayInUserTimezone(date: UTCDate): UTCDate {
    const userDate = this.toUserTimezone(date);
    const endOfUserDay = endOfDay(userDate);
    return this.toUTC(endOfUserDay);
  }

  startOfHourInUserTimezone(date: UTCDate): UTCDate {
    const userDate = this.toUserTimezone(date);
    const startOfUserHour = startOfHour(userDate);
    return this.toUTC(startOfUserHour);
  }

  endOfHourInUserTimezone(date: UTCDate): UTCDate {
    const userDate = this.toUserTimezone(date);
    const endOfUserHour = endOfHour(userDate);
    return this.toUTC(endOfUserHour);
  }

  startOfMinuteInUserTimezone(date: UTCDate): UTCDate {
    const userDate = this.toUserTimezone(date);
    const startOfUserMinute = startOfMinute(userDate);
    return this.toUTC(startOfUserMinute);
  }

  endOfMinuteInUserTimezone(date: UTCDate): UTCDate {
    const userDate = this.toUserTimezone(date);
    const endOfUserMinute = endOfMinute(userDate);
    return this.toUTC(endOfUserMinute);
  }

  /**
   * Get granularity start/end in UTC
   */
  getGranularityBoundaries(date: UTCDate, granularity: GranularityRangeValues): { start: UTCDate; end: UTCDate } {
    switch (granularity) {
      case 'day':
        return {
          start: this.startOfDayInUserTimezone(date),
          end: this.endOfDayInUserTimezone(date),
        };
      case 'hour':
        return {
          start: this.startOfHourInUserTimezone(date),
          end: this.endOfHourInUserTimezone(date),
        };
      case 'minute':
        return {
          start: this.startOfMinuteInUserTimezone(date),
          end: this.endOfMinuteInUserTimezone(date),
        };
      default:
        throw new Error(`Unsupported granularity: ${granularity}`);
    }
  }

  /**
   * Get user timezone boundaries for a date range
   * Useful for ensuring time ranges respect user's day/hour boundaries
   */
  getUserTimezoneBoundaries(
    startDate: UTCDate,
    endDate: UTCDate,
    granularity: GranularityRangeValues,
  ): { start: UTCDate; end: UTCDate } {
    const startBoundary = this.getGranularityBoundaries(startDate, granularity).start;
    const endBoundary = this.getGranularityBoundaries(endDate, granularity).end;

    return {
      start: startBoundary,
      end: endBoundary,
    };
  }
}

/**
 * Convenience functions for common operations
 */

/**
 * Create a timezone helper for a specific user timezone
 */
export function createTimezoneHelper(userTimezone: string): TimezoneAwareDateHelper {
  return new TimezoneAwareDateHelper(userTimezone);
}

/**
 * Format a UTC date for display in user's timezone
 */
export function formatDateInUserTimezone(
  utcDate: UTCDate,
  userTimezone: string,
  formatter: (date: TZDate) => string,
): string {
  const helper = createTimezoneHelper(userTimezone);
  const userDate = helper.toUserTimezone(utcDate);
  return formatter(userDate);
}

/**
 * Convert user-input dates to UTC for backend queries
 * This is the main function TimeRangeSelector will use
 */
export function convertUserDatesToUTC(
  userStartDate: TZDate,
  userEndDate: TZDate,
  userTimezone: string,
): { startDate: UTCDate; endDate: UTCDate } {
  const helper = createTimezoneHelper(userTimezone);

  return {
    startDate: helper.toUTC(userStartDate),
    endDate: helper.toUTC(userEndDate),
  };
}

/**
 * Convert UTC dates from backend to user timezone for display
 */
export function convertUTCDatesToUser(
  utcStartDate: UTCDate,
  utcEndDate: UTCDate,
  userTimezone: string,
): { startDate: TZDate; endDate: TZDate } {
  const helper = createTimezoneHelper(userTimezone);

  return {
    startDate: helper.toUserTimezone(utcStartDate),
    endDate: helper.toUserTimezone(utcEndDate),
  };
}
