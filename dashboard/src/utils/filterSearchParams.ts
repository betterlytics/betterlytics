import { QueryFilter } from '@/entities/filter';
import { GranularityRangeValues, getAllowedGranularities, getValidGranularityFallback } from './granularityRanges';
import {
  getCompareRangeForTimePresets,
  getDateRangeForTimePresets,
  getDateWithTimeOfDay,
  getEndDateWithGranularity,
  getStartDateWithGranularity,
} from './timeRanges';
import { FilterQueryParams } from '@/entities/filterQueryParams';

type Filters = {
  queryFilters: (QueryFilter & { id: string })[];
  startDate: Date;
  endDate: Date;
  granularity: GranularityRangeValues;
  userJourney: {
    numberOfSteps: number;
    numberOfJourneys: number;
  };
  compareEnabled?: boolean;
  compareStartDate?: Date;
  compareEndDate?: Date;
};

function getDefaultFilters(): Filters {
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
    userJourney: {
      numberOfSteps: 3,
      numberOfJourneys: 5,
    },
    compareEnabled: true,
    compareStartDate: compareStart,
    compareEndDate: compareEnd,
  };
}

function encode(params: Filters): string {
  const json = JSON.stringify(params);
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)));
}

function decode(base64: string): Filters {
  try {
    const decodedJson = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    const decoded = JSON.parse(decodedJson) as Partial<Filters>;
    const withDefaults = {
      ...getDefaultFilters(),
      ...decoded,
    };

    const startDate = new Date(withDefaults.startDate);
    const endDate = new Date(withDefaults.endDate);

    if (!withDefaults.compareEnabled) {
      withDefaults.compareStartDate = undefined;
      withDefaults.compareEndDate = undefined;
    }

    const allowedGranularities = getAllowedGranularities(startDate, endDate);
    const validGranularity = getValidGranularityFallback(withDefaults.granularity, allowedGranularities);

    return {
      ...withDefaults,
      startDate: startDate,
      endDate: endDate,
      compareStartDate: withDefaults.compareStartDate && new Date(withDefaults.compareStartDate),
      compareEndDate: withDefaults.compareEndDate && new Date(withDefaults.compareEndDate),
      granularity: validGranularity,
    };
  } catch (error) {
    console.warn('Failed to decode filters from URL, using defaults:', error);
    return getDefaultFilters();
  }
}

async function decodeFromParams(paramsPromise: Promise<{ filters: string }>) {
  const { filters } = await paramsPromise;

  if (!filters) {
    return getDefaultFilters();
  }

  return decode(filters);
}

function filterVariable(key: string, value: unknown) {
  // Check if filters are required or if they already match the default filters
  const defaultFilters = getDefaultFilters();
  if (key in defaultFilters && JSON.stringify(value) === JSON.stringify(defaultFilters[key as keyof Filters])) {
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

// Encode different values in different formats
function encodeValue(value: unknown) {
  switch (typeof value) {
    case 'number':
    case 'boolean':
    case 'string':
      return value.toString();
    case 'object':
      if (value instanceof Date) {
        return value.toISOString();
      }
      return JSON.stringify(value);
  }
  throw new Error(`Unknown type for: ${value}`);
}

function newEncode(params: FilterQueryParams) {
  return Object.entries(params)
    .filter(([key, value]) => filterVariable(key, value))
    .map(([key, value]) => [key, encodeValue(value)]);
}

async function newDecode() {}

export const BAFilterSearchParams = {
  encode,
  decode,
  decodeFromParams,
  getDefaultFilters,
  newEncode,
  newDecode,
};
