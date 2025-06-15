import { QueryFilter } from '@/entities/filter';
import { GranularityRangeValues } from './granularityRanges';

type Filters = {
  queryFilters: (QueryFilter & { id: string })[];
  startDate: Date;
  endDate: Date;
  granularity: GranularityRangeValues;
  compareStartDate?: Date;
  compareEndDate?: Date;
  userJourney: {
    numberOfSteps: number;
    numberOfJourneys: number;
  };
};

function getDefaultFilters(): Filters {
  return {
    queryFilters: [],
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now()),
    granularity: 'day',
    compareStartDate: undefined,
    compareEndDate: undefined,
    userJourney: {
      numberOfSteps: 3,
      numberOfJourneys: 5,
    },
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
  return {
    ...withDefaults,
    startDate: new Date(withDefaults.startDate),
    endDate: new Date(withDefaults.endDate),
    compareStartDate: withDefaults.compareStartDate ? new Date(withDefaults.compareStartDate) : undefined,
    compareEndDate: withDefaults.compareEndDate ? new Date(withDefaults.compareEndDate) : undefined,
  };
}

async function decodeFromParams(paramsPromise: Promise<{ filters: string }>): Promise<Filters> {
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
};
