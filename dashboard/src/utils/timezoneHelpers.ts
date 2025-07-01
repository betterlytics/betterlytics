import { startOfDay, endOfDay, startOfHour, endOfHour, startOfMinute, endOfMinute } from 'date-fns';
import { GranularityRangeValues } from './granularityRanges';

/**
 * Timezone-aware date utilities
 */
export class TimezoneAwareDateHelper {
  startOfDayInUserTimezone(date: Date): Date {
    return startOfDay(date);
  }

  endOfDayInUserTimezone(date: Date): Date {
    return endOfDay(date);
  }

  startOfHourInUserTimezone(date: Date): Date {
    return startOfHour(date);
  }

  endOfHourInUserTimezone(date: Date): Date {
    return endOfHour(date);
  }

  startOfMinuteInUserTimezone(date: Date): Date {
    return startOfMinute(date);
  }

  endOfMinuteInUserTimezone(date: Date): Date {
    return endOfMinute(date);
  }

  /**
   * Get granularity start/end
   */
  getGranularityBoundaries(date: Date, granularity: GranularityRangeValues): { start: Date; end: Date } {
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
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
  ): { start: Date; end: Date } {
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
export function createTimezoneHelper(): TimezoneAwareDateHelper {
  return new TimezoneAwareDateHelper();
}
