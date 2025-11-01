import {
  getDateRangeForTimePresets,
  getDateWithTimeOfDay,
  getEndDateWithGranularity,
  getStartDateWithGranularity,
} from './timeRanges';
import { deriveCompareRange } from './compareRanges';
import { FilterQueryParams, FilterQueryParamsSchema, FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getCompareTimeRange, getTimeRange } from '@/lib/ba-timerange';

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

  const { start, end } = getTimeRange(
    filters.interval,
    timezone,
    filters.startDate,
    filters.endDate,
    filters.offset,
  );
  const { start: compareStart, end: compareEnd } = getCompareTimeRange(
    filters.compare,
    timezone,
    start,
    end,
    filters.compareStartDate,
    filters.compareEndDate,
  );

  filters.startDate = start;
  filters.endDate = end;

  filters.compareStartDate = compareStart;
  filters.compareEndDate = compareEnd;

  return FilterQueryParamsSchema.parse(filters);
}

export const BAFilterSearchParams = {
  getDefaultFilters,
  encode,
  decode,
};
