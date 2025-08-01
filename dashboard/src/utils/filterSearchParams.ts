import { QueryFilter } from '@/entities/filter';
import { GranularityRangeValues, getAllowedGranularities, getValidGranularityFallback } from './granularityRanges';
import {
  getCompareRangeForTimePresets,
  getDateRangeForTimePresets,
  getDateWithTimeOfDay,
  getEndDateWithGranularity,
  getStartDateWithGranularity,
} from './timeRanges';

type Filters = {
  granularity: GranularityRangeValues;
  startDate: Date;
  endDate: Date;
  compareEnabled?: boolean;
  compareStartDate?: Date;
  compareEndDate?: Date;
  queryFilters: (QueryFilter & { id: string })[];
  userJourney: {
    numberOfSteps: number;
    numberOfJourneys: number;
  };
};

type Encoders = {
  [K in keyof Filters]: (value: any) => string;
};
type Decoders = {
  [K in keyof Filters]: (value: string) => any;
};

const encoders: Encoders = {
  queryFilters: (value) => JSON.stringify(value),
  granularity: (value) => value,
  userJourney: (value) => JSON.stringify(value),
  startDate: (value) => value.valueOf(),
  endDate: (value) => value.valueOf(),
  compareEnabled: (value) => JSON.stringify(value),
  compareStartDate: (value) => value?.valueOf(),
  compareEndDate: (value) => value?.valueOf(),
};

const decoders: Decoders = {
  queryFilters: (value) => JSON.parse(value),
  granularity: (value) => value,
  userJourney: (value) => JSON.parse(value),
  startDate: (value) => new Date(value),
  endDate: (value) => new Date(value),
  compareEnabled: (value) => JSON.parse(value),
  compareStartDate: (value) => value,
  compareEndDate: (value) => value,
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
    granularity,
    startDate,
    endDate,
    compareEnabled: true,
    compareStartDate: compareStart,
    compareEndDate: compareEnd,
    queryFilters: [],
    userJourney: {
      numberOfSteps: 3,
      numberOfJourneys: 5,
    },
  };
}

function encode(params: Filters): URLSearchParams {
  const queryParams = Object.entries(params)
    .filter(([key, value]) => key !== undefined && value !== undefined)
    .map(([key, value]) => {
      const encoder = encoders[key as keyof Filters];

      if (encoder === undefined) {
        throw `No encoder found for ${key}`;
      }

      return `${key}-${encoder(value)}`;
    })
    .join('_');

  return new URLSearchParams([['filters', queryParams]]);
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

export const BAFilterSearchParams = {
  encode,
  decode,
  decodeFromParams,
  getDefaultFilters,
};
