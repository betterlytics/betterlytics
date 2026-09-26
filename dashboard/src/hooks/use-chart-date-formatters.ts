import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { defaultDateLabelFormatter, granularityDateFormatter } from '@/utils/chartUtils';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

/**
 * Chart axis and tooltip date formatters in the zone the dashboard data was bucketed in
 */
export function useChartDateFormatters(granularity?: GranularityRangeValues) {
  const locale = useLocale();
  const { timeZone } = useTimeRangeContext();

  return useMemo(
    () => ({
      timeZone,
      axisFormatter: granularityDateFormatter(granularity, locale, timeZone),
      labelFormatter: (date: string | number) => defaultDateLabelFormatter(date, granularity, locale, timeZone),
    }),
    [granularity, locale, timeZone],
  );
}
