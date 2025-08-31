'server-only';

import type { QueryFilter } from '@/entities/filter';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

import { getRangeWithGranularity } from '@/utils/timeRanges';
import { getPageAnalytics, getTotalPageViewsForSite } from '@/services/pages';
import { getUniqueVisitorsForSite } from '@/services/visitors';
import { getReferrerTableDataForSite } from '@/services/referrers';

import { toAreaChart } from '@/presenters/toAreaChart';
import { toDataTable } from '@/presenters/toDataTable';

/**
 * Generates AI Insights for a dashboard
 */
export async function getAIInsights(siteId: string) {
  const params = getServiceQueryParams(siteId);

  const compiled = await getCompiledPresentedData(params);

  console.log(compiled);
}

function getServiceQueryParams(siteId: string) {
  const queryFilters: QueryFilter[] = [];
  const granularity: GranularityRangeValues = 'day';
  const range = getRangeWithGranularity('7d', granularity);

  return {
    siteId,
    queryFilters,
    granularity,
    ...range,
  };
}

async function getCompiledPresentedData(params: ReturnType<typeof getServiceQueryParams>) {
  const comparable = createComparableDatePresenterFactory(params);

  const totalPageViews = await comparable(
    ({ siteId, startDate, endDate, granularity, queryFilters }) =>
      getTotalPageViewsForSite(siteId, startDate, endDate, granularity, queryFilters),
    (combined) => toAreaChart({ ...combined, dataKey: 'views' }),
  );

  const uniqueVisitors = await comparable(
    ({ siteId, startDate, endDate, granularity, queryFilters }) =>
      getUniqueVisitorsForSite(siteId, startDate, endDate, granularity, queryFilters),
    (combined) => toAreaChart({ ...combined, dataKey: 'unique_visitors' }),
  );

  const topPages = await comparable(
    ({ siteId, startDate, endDate, queryFilters }) => getPageAnalytics(siteId, startDate, endDate, queryFilters),
    (combined) => toDataTable({ ...combined, categoryKey: 'path' }),
  );

  const referrers = await comparable(
    ({ siteId, startDate, endDate, queryFilters }) =>
      getReferrerTableDataForSite(siteId, startDate, endDate, queryFilters),
    (combined) => toDataTable({ ...combined, categoryKey: 'source_name' }),
  );

  return {
    totalPageViews,
    uniqueVisitors,
    topPages,
    referrers,
  };
}

// Helper utilities

type QueryParams = ReturnType<typeof getServiceQueryParams>;

type BaseFactoryParams = Omit<QueryParams, 'customStart' | 'customEnd' | 'compareStart' | 'compareEnd'>;

type FactoryParams = BaseFactoryParams & {
  startDate: Date;
  endDate: Date;
};

type ComparableData<T> = {
  granularity: GranularityRangeValues;
  data: T;
  compare: T;
  dateRange: {
    start: Date;
    end: Date;
  };
  compareDateRange: {
    start: Date;
    end: Date;
  };
};

function createComparableDatePresenterFactory(params: ReturnType<typeof getServiceQueryParams>) {
  const baseParams: BaseFactoryParams = {
    siteId: params.siteId,
    queryFilters: params.queryFilters,
    granularity: params.granularity,
  };
  return async function <T, E>(
    callback: (params: FactoryParams) => Promise<T>,
    present: (combined: ComparableData<T>) => E = (combined) => combined as unknown as E,
  ) {
    const data = await callback({
      ...baseParams,
      startDate: params.customStart,
      endDate: params.customEnd,
    });

    const compare = await callback({
      ...baseParams,
      startDate: params.compareStart,
      endDate: params.compareEnd,
    });

    const combined: ComparableData<T> = {
      data,
      compare,
      dateRange: {
        start: params.customStart,
        end: params.customEnd,
      },
      compareDateRange: {
        start: params.compareStart,
        end: params.compareEnd,
      },
      granularity: params.granularity,
    };

    return present(combined);
  };
}
