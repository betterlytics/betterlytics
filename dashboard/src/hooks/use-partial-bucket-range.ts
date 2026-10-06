import { useLocale } from 'next-intl';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { getPartialBucketRange } from '@/utils/dateFormatters';

/**
 * Returns the actual date range when a week/month bucket is only partially covered by the selected time range.
 * Returns undefined for buckets that are complete
 */
export function usePartialBucketRange(
  bucketDate: number | string | Date | undefined,
  comparisonDate: number | string | Date | undefined,
) {
  const { resolvedMainRange, resolvedCompareRange, granularity, timeZone } = useTimeRangeContext();
  const locale = useLocale();

  if (granularity !== 'week' && granularity !== 'month') {
    return { partialRange: undefined, comparePartialRange: undefined };
  }

  const partialRange = getPartialBucketRange(
    bucketDate,
    resolvedMainRange.start,
    resolvedMainRange.end,
    granularity,
    locale,
    timeZone,
  );

  const comparePartialRange = resolvedCompareRange
    ? getPartialBucketRange(
        comparisonDate,
        resolvedCompareRange.start,
        resolvedCompareRange.end,
        granularity,
        locale,
        timeZone,
      )
    : undefined;

  return { partialRange, comparePartialRange };
}
