import {
  getDateRangeForTimePresets,
  getDateWithTimeOfDay,
  getEndDateWithGranularity,
  getStartDateWithGranularity,
} from './timeRanges';
import { deriveCompareRange } from './compareRanges';
import { FilterQueryParams, FilterQueryParamsSchema, FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getResolvedRanges } from '@/lib/ba-timerange';
import { getAllowedGranularities, getValidGranularityFallback } from './granularityRanges';

function getDefaultFilters(): FilterQueryParams {
  const granularity = 'hour';
  let { startDate, endDate } = getDateRangeForTimePresets('24h');
  const derived = deriveCompareRange(startDate, endDate, 'previous');
  let compareStart = derived?.startDate ?? startDate;
  let compareEnd = derived?.endDate ?? endDate;

  startDate = getStartDateWithGranularity(startDate, granularity);
  endDate = getEndDateWithGranularity(endDate, granularity);
  compareStart = getStartDateWithGranularity(getDateWithTimeOfDay(compareStart, startDate), granularity);
  compareEnd = getEndDateWithGranularity(getDateWithTimeOfDay(compareEnd, endDate), granularity);

  return {
    queryFilters: [],
    startDate,
    endDate,
    granularity,
    interval: '24h',
    compare: 'previous',
    compareAlignWeekdays: false,
    userJourney: {
      numberOfSteps: 3,
      numberOfJourneys: 5,
    },
    compareStartDate: compareStart,
    compareEndDate: compareEnd,
    offset: 0,
  };
}

function filterVariable(key: string, value: unknown) {
  const defaultFilters = getDefaultFilters();

  // Check if filters are actual filters
  if (key in defaultFilters === false) {
    return false;
  }

  // Don't filter dates
  if (value instanceof Date) {
    return true;
  }

  // Check if filters are required or if they already match the default filters
  if (
    key in defaultFilters &&
    JSON.stringify(value) === JSON.stringify(defaultFilters[key as keyof FilterQueryParams])
  ) {
    return false;
  }

  // Filter non-value values
  if (value === undefined || value === null) {
    return false;
  }

  // Filter empty objects (except dates)
  if (typeof value === 'object') {
    return Object.keys(value).length !== 0;
  }

  // Keep remaining
  return true;
}

// Encode filter values
function encodeValue<Key extends keyof FilterQueryParams>(key: Key, value: unknown): string {
  switch (key) {
    case 'startDate':
    case 'endDate':
    case 'compareStartDate':
    case 'compareEndDate':
      return (value as Date).toISOString();
    case 'queryFilters':
    case 'userJourney':
      return JSON.stringify(value);
    case 'granularity':
      return value as FilterQueryParams['granularity'];
    case 'interval':
      return value as FilterQueryParams['interval'];
    case 'offset':
      return (value as number).toString();
    case 'compare':
      return value as FilterQueryParams['compare'];
    case 'compareAlignWeekdays':
      return (value as boolean) ? '1' : '0';
  }

  throw new Error(`Unknown filter key "${key}"`);
}

function encode(params: FilterQueryParams) {
  return Object.entries(params)
    .filter(([key, value]) => filterVariable(key, value))
    .map(([key, value]) => [key, encodeValue(key as keyof FilterQueryParams, value)]);
}

function decodeValue<Key extends keyof FilterQueryParams>(
  key: Key,
  value: string,
): FilterQueryParams[keyof FilterQueryParams] {
  switch (key) {
    case 'startDate':
    case 'endDate':
    case 'compareStartDate':
    case 'compareEndDate':
      return new Date(value);
    case 'queryFilters':
    case 'userJourney':
      return JSON.parse(value);
    case 'granularity':
      return value as FilterQueryParams['granularity'];
    case 'interval':
      return value as FilterQueryParams['interval'];
    case 'offset':
      return Number(value);
    case 'compare':
      return value as FilterQueryParams['compare'];
    case 'compareAlignWeekdays':
      return value === '1' || value === 'true';
  }

  throw new Error(`Unknown filter key "${key}"`);
}

function enforceGranularityAndDuration(
  timezone: string,
  {
    interval,
    compare,
    startDate,
    endDate,
    granularity,
    compareStartDate,
    compareEndDate,
    offset,
    compareAlignWeekdays,
  }: {
    interval: FilterQueryParams['interval'];
    compare: FilterQueryParams['compare'];
    startDate: Date;
    endDate: Date;
    granularity: FilterQueryParams['granularity'];
    compareStartDate?: Date;
    compareEndDate?: Date;
    offset?: number;
    compareAlignWeekdays?: boolean;
  },
) {
  const initial = getResolvedRanges(
    interval,
    compare,
    timezone,
    startDate,
    endDate,
    granularity,
    compareStartDate,
    compareEndDate,
    offset,
    compareAlignWeekdays,
  );

  let nextStart = initial.main.start;
  let nextEnd = initial.main.end;
  let nextGranularity = granularity;

  const maxMs = 366 * 24 * 60 * 60 * 1000;
  if (nextEnd.getTime() - nextStart.getTime() > maxMs) {
    nextEnd = new Date(nextStart.getTime() + maxMs);
  }

  const allowed = getAllowedGranularities(nextStart, nextEnd);
  nextGranularity = getValidGranularityFallback(nextGranularity, allowed);

  const needsRecompute =
    nextStart.getTime() !== initial.main.start.getTime() ||
    nextEnd.getTime() !== initial.main.end.getTime() ||
    nextGranularity !== granularity;

  if (!needsRecompute) {
    return {
      main: initial.main,
      compare: initial.compare,
      startDate: initial.main.start,
      endDate: initial.main.end,
      granularity,
    } as const;
  }

  const recomputed = getResolvedRanges(
    interval,
    compare,
    timezone,
    nextStart,
    nextEnd,
    nextGranularity,
    compareStartDate,
    compareEndDate,
    offset,
    compareAlignWeekdays,
  );

  return {
    main: recomputed.main,
    compare: recomputed.compare,
    startDate: recomputed.main.start,
    endDate: recomputed.main.end,
    granularity: nextGranularity,
  } as const;
}

function decode(params: FilterQuerySearchParams, timezone: string) {
  const defaultFilters = getDefaultFilters();

  const decodedEntries = Object.entries(params)
    .filter(([key]) => key in defaultFilters)
    .map(([key, value]) => [key, decodeValue(key as keyof FilterQueryParams, value)]);

  const decoded = Object.fromEntries(decodedEntries) as Partial<FilterQueryParams>;

  const filters = {
    ...defaultFilters,
    ...decoded,
  };

  const enforced = enforceGranularityAndDuration(timezone, {
    interval: filters.interval,
    compare: filters.compare,
    startDate: filters.startDate,
    endDate: filters.endDate,
    granularity: filters.granularity,
    compareStartDate: filters.compareStartDate,
    compareEndDate: filters.compareEndDate,
    offset: filters.offset,
    compareAlignWeekdays: filters.compareAlignWeekdays,
  });

  filters.startDate = enforced.startDate;
  filters.endDate = enforced.endDate;
  filters.granularity = enforced.granularity;

  filters.compareStartDate = enforced.compare?.start;
  filters.compareEndDate = enforced.compare?.end;

  return FilterQueryParamsSchema.parse(filters);
}

export const BAFilterSearchParams = {
  getDefaultFilters,
  encode,
  decode,
};
