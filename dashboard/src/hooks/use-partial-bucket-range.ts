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
  const { resolvedMainRange, resolvedCompareRange, granularity } = useTimeRangeContext();

  if (granularity !== 'week' && granularity !== 'month') {
    return { partialRange: undefined, comparePartialRange: undefined };
  }

  const partialRange = getPartialBucketRange(
    bucketDate,
    resolvedMainRange.start,
    resolvedMainRange.end,
    granularity,
  );

  const comparePartialRange = resolvedCompareRange
    ? getPartialBucketRange(comparisonDate, resolvedCompareRange.start, resolvedCompareRange.end, granularity)
    : undefined;

  return { partialRange, comparePartialRange };
}
