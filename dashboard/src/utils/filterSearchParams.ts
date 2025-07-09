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
