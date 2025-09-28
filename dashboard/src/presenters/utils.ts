import { getTimeIntervalForGranularity } from '@/utils/chartUtils';
import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { type ChartPoint } from './toAreaChart';

export function findFirstIncompleteIndexForChart(
  chart: ChartPoint[],
  granularity: GranularityRangeValues,
  nowTimestamp: number,
): number {
  const interval = getTimeIntervalForGranularity(granularity);
  for (let i = 0; i < chart.length; i++) {
    const bucketStart = chart[i].date;
    const bucketEnd = interval.offset(new Date(bucketStart), 1).valueOf();
    if (bucketEnd > nowTimestamp) return i;
  }
  return -1;
}

export function splitSeriesForIncomplete(
  chart: ChartPoint[],
  firstIncompleteIndex: number,
): {
  solid: ChartPoint[];
  incomplete: ChartPoint[] | undefined;
} {
  if (firstIncompleteIndex === -1) return { solid: chart, incomplete: undefined };

  const startIndex = firstIncompleteIndex > 0 ? firstIncompleteIndex - 1 : 0;

  return {
    solid: chart.slice(0, firstIncompleteIndex),
    incomplete: chart.slice(startIndex, firstIncompleteIndex + 1), // only prev + first incomplete
  };
}
export function maskPrimaryAfterIndex(chart: ChartPoint[], firstIncompleteIndex: number): ChartPoint[] {
  if (firstIncompleteIndex === -1) return chart;
  return chart.map((point, index) =>
    index >= firstIncompleteIndex ? { ...point, value: [null, ...point.value.slice(1)] } : point,
  );
}

export function getIncompleteSplit(
  chart: ChartPoint[],
  granularity: GranularityRangeValues,
  nowTimestamp: number,
  bucketIncomplete?: boolean,
): {
  firstIncompleteIndex: number;
  shouldSplit: boolean;
  solid: ChartPoint[];
  incomplete: ChartPoint[] | undefined;
} {
  const firstIncompleteIndex = findFirstIncompleteIndexForChart(chart, granularity, nowTimestamp);
  const hasIncompleteTail = firstIncompleteIndex !== -1;
  const incompleteCount = hasIncompleteTail ? chart.length - firstIncompleteIndex : 0;
  let incompleteSeriesLength = 0;
  if (hasIncompleteTail) {
    incompleteSeriesLength = incompleteCount;
    if (firstIncompleteIndex > 0) {
      incompleteSeriesLength += 1;
    }
  }
  const shouldSplit = !!bucketIncomplete && hasIncompleteTail && incompleteSeriesLength >= 2;
  if (!shouldSplit) {
    return { firstIncompleteIndex, shouldSplit, solid: chart, incomplete: undefined };
  }
  const { solid, incomplete } = splitSeriesForIncomplete(chart, firstIncompleteIndex);
  return { firstIncompleteIndex, shouldSplit, solid, incomplete };
}
