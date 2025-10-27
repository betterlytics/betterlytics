import {
  getDateRangeForTimePresets,
  getDateWithTimeOfDay,
  getEndDateWithGranularity,
  getStartDateWithGranularity,
} from './timeRanges';
import { deriveCompareRange } from './compareRanges';
import { FilterQueryParams, FilterQueryParamsSchema, FilterQuerySearchParams } from '@/entities/filterQueryParams';

// Ensure deterministic JSON encoding (stable key order) to avoid URL flicker
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortKeysDeep(obj[key]);
      });
    return sorted;
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

const ENCODE_ORDER: Array<keyof FilterQueryParams> = [
  'startDate',
  'endDate',
  'interval',
  'offset',
  'granularity',
  'compare',
  'compareStartDate',
  'compareEndDate',
  'compareAlignWeekdays',
  'queryFilters',
  'userJourney',
];

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
    stableStringify(value) === stableStringify(defaultFilters[key as keyof FilterQueryParams])
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
      return stableStringify(value);
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
  return ENCODE_ORDER.filter((key) => filterVariable(key, params[key])).map((key) => [
    key,
    encodeValue(key, params[key]),
  ]);
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

  if (filters.compare === 'off') {
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
