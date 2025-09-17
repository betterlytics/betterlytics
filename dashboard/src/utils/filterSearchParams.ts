import {
  getDateRangeForTimePresets,
  getDateWithTimeOfDay,
  getEndDateWithGranularity,
  getStartDateWithGranularity,
} from './timeRanges';
import { getCompareRangeForTimePresets } from './compareRanges';
import { FilterQueryParams, FilterQueryParamsSchema, FilterQuerySearchParams } from '@/entities/filterQueryParams';

function getDefaultFilters(): FilterQueryParams {
  const granularity = 'hour';
  let { startDate, endDate } = getDateRangeForTimePresets('24h');
  let { compareStart, compareEnd } = getCompareRangeForTimePresets('24h');

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
    userJourney: {
      numberOfSteps: 3,
      numberOfJourneys: 5,
    },
    compareEnabled: true,
    compareStartDate: compareStart,
    compareEndDate: compareEnd,
  };
}

function filterVariable(key: string, value: unknown) {
  const defaultFilters = getDefaultFilters();

  // Check if filters are actual filters
  if (key in defaultFilters === false) {
    return false;
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
    if (value instanceof Date) {
      return true;
    }

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
    case 'compareEnabled':
    case 'queryFilters':
    case 'userJourney':
      return JSON.stringify(value);
    case 'granularity':
      return value as FilterQueryParams['granularity'];
    case 'interval':
      return value as FilterQueryParams['interval'];
    case 'compare':
      return value as FilterQueryParams['compare'];
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
    case 'compareEnabled':
    case 'queryFilters':
    case 'userJourney':
      return JSON.parse(value);
    case 'granularity':
      return value as FilterQueryParams['granularity'];
    case 'interval':
      return value as FilterQueryParams['interval'];
    case 'compare':
      return value as FilterQueryParams['compare'];
  }

  throw new Error(`Unknown filter key "${key}"`);
}

function decode(params: FilterQuerySearchParams) {
  const defaultFilters = getDefaultFilters();

  const decodedEntries = Object.entries(params)
    .filter(([key]) => key in defaultFilters)
    .map(([key, value]) => [key, decodeValue(key as keyof FilterQueryParams, value)]);

  const decoded = Object.fromEntries(decodedEntries) as Partial<FilterQueryParams>;

  const filters = {
    ...defaultFilters,
    ...decoded,
  };

  if (filters.compareEnabled === false) {
    filters.compareStartDate = undefined;
    filters.compareEndDate = undefined;
  }

  return FilterQueryParamsSchema.parse(filters);
}

export const BAFilterSearchParams = {
  getDefaultFilters,
  encode,
  decode,
};
