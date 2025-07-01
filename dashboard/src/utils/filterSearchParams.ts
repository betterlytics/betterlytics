import { subDays } from 'date-fns';
import { QueryFilter } from '@/entities/filter';
import { GranularityRangeValues, getAllowedGranularities, getValidGranularityFallback } from './granularityRanges';

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
  const now = Date.now();
  const oneWeekAgo = subDays(now, 6);
  const oneFortnightAgo = subDays(oneWeekAgo, 7);
  return {
    queryFilters: [],
    startDate: new Date(oneWeekAgo) as Date,
    endDate: new Date(now) as Date,
    granularity: 'day',
    userJourney: {
      numberOfSteps: 3,
      numberOfJourneys: 5,
    },
    compareEnabled: true,
    compareStartDate: new Date(oneFortnightAgo) as Date,
    compareEndDate: new Date(oneWeekAgo) as Date,
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

  const startDate = new Date(withDefaults.startDate) as Date;
  const endDate = new Date(withDefaults.endDate) as Date;

  if (!withDefaults.compareEnabled) {
    withDefaults.compareStartDate = undefined;
    withDefaults.compareEndDate = undefined;
  }

  const allowedGranularities = getAllowedGranularities(startDate, endDate);
  const validGranularity = getValidGranularityFallback(withDefaults.granularity, allowedGranularities);

  return {
    ...withDefaults,
    startDate,
    endDate,
    compareStartDate: withDefaults.compareStartDate
      ? (new Date(withDefaults.compareStartDate) as Date)
      : undefined,
    compareEndDate: withDefaults.compareEndDate ? (new Date(withDefaults.compareEndDate) as Date) : undefined,
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
