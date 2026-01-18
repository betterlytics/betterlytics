import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { type ComparisonMapping } from '@/types/charts';
import { getDateKey } from '@/utils/dateHelpers';

export type ChartPoint = { date: number; value: Array<number | null> };

type DataToAreaChartProps<K extends string> = {
  dataKey: K;
  data: Array<{ date: string } & Record<K, number>>;
  granularity: GranularityRangeValues;
  dateRange: {
    start: Date;
    end: Date;
  };
};

type ToAreaChartProps<K extends string> = DataToAreaChartProps<K> & {
  compare?: Array<{ date: string } & Record<K, number>>;
  compareDateRange?: {
    start?: Date;
    end?: Date;
  };
  // NEW: Bucket fill range for incomplete detection
  bucketFillRange?: {
    start: Date;
    end: Date;
  };
};

function dataToAreaChart<K extends string>({ dataKey, data }: Pick<DataToAreaChartProps<K>, 'dataKey' | 'data'>) {
  const groupedData = data.reduce(
    (group, row) => {
      const key = getDateKey(row.date);
      group[key] = row[dataKey];
      return group;
    },
    {} as Record<string, number>,
  );

  return Object.keys(groupedData)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map((ts) => ({ date: ts, value: [groupedData[String(ts)] ?? 0] }));
}

type AreaChartResult = {
  data: Array<{ date: number; value: Array<number | null> }>;
  comparisonMap?: ComparisonMapping[];
  incompleteStart?: Array<{ date: number; value: Array<number | null> }>;
  incompleteEnd?: Array<{ date: number; value: Array<number | null> }>;
};

/**
 * Detects incomplete buckets at start and end of the chart.
 * - Start is incomplete if bucketFillRange.start < dateRange.start
 * - End is incomplete if dateRange.end > now OR if bucketFillRange end > dateRange.end
 */
function detectIncompleteBuckets(
  dateRange: { start: Date; end: Date },
  bucketFillRange?: { start: Date; end: Date },
): { isStartIncomplete: boolean; isEndIncomplete: boolean } {
  if (!bucketFillRange) {
    return { isStartIncomplete: false, isEndIncomplete: false };
  }

  const now = Date.now();

  // Start is incomplete if fill range starts before actual data range
  const isStartIncomplete = bucketFillRange.start.getTime() < dateRange.start.getTime();

  // End is incomplete if:
  // 1. Date range ends in the future (still collecting data), OR
  // 2. Date range end is NOT aligned to bucket boundary
  //    (bucketFillRange.end > dateRange.end means we're mid-bucket)
  const isEndIncomplete = dateRange.end.getTime() > now || bucketFillRange.end.getTime() > dateRange.end.getTime();

  return { isStartIncomplete, isEndIncomplete };
}

export function toAreaChart<K extends string>({
  dataKey,
  data,
  compare,
  compareDateRange,
  dateRange,
  bucketFillRange,
}: ToAreaChartProps<K>): AreaChartResult {
  const chart = dataToAreaChart({ dataKey, data });

  if (chart.length === 0) {
    return { data: chart };
  }

  const { isStartIncomplete, isEndIncomplete } = detectIncompleteBuckets(dateRange, bucketFillRange);

  // Split incomplete start (first bucket)
  let incompleteStart: ChartPoint[] | undefined;
  if (isStartIncomplete && chart.length >= 2) {
    incompleteStart = chart.slice(0, 2);
  }

  // Split incomplete end (last bucket)
  let incompleteEnd: ChartPoint[] | undefined;
  if (isEndIncomplete && chart.length >= 2) {
    const startIndex = Math.max(0, chart.length - 2);
    incompleteEnd = chart.slice(startIndex);
  }

  if (!compare) {
    return {
      data: chart,
      incompleteStart,
      incompleteEnd,
    };
  }

  if (!compareDateRange?.start || !compareDateRange?.end) {
    throw 'Compare date range must be specified if compare data is received';
  }

  const compareChart = dataToAreaChart({ dataKey, data: compare });

  if (chart.length !== compareChart.length) {
    return { data: chart, incompleteStart, incompleteEnd };
  }

  const chartData = chart.map((point, index) => ({
    date: point.date,
    value: [...point.value, ...compareChart[index].value],
  }));

  const comparisonMap = createComparisonMap(chartData, compareChart, dataKey);

  // For comparison charts, update incomplete series to include comparison values
  let incompleteStartWithCompare: ChartPoint[] | undefined;
  if (incompleteStart && compareChart.length >= 2) {
    incompleteStartWithCompare = incompleteStart.map((point, i) => ({
      date: point.date,
      value: [...point.value, ...compareChart[i].value],
    }));
  }

  let incompleteEndWithCompare: ChartPoint[] | undefined;
  if (incompleteEnd && compareChart.length >= 2) {
    const compareStartIndex = Math.max(0, compareChart.length - 2);
    incompleteEndWithCompare = incompleteEnd.map((point, i) => ({
      date: point.date,
      value: [...point.value, ...compareChart[compareStartIndex + i].value],
    }));
  }

  // Mask the primary series values where they overlap with incomplete regions
  const maskedData = maskIncompleteRegions(chartData, isStartIncomplete, isEndIncomplete);

  return {
    data: maskedData,
    comparisonMap,
    incompleteStart: incompleteStartWithCompare,
    incompleteEnd: incompleteEndWithCompare,
  };
}

function maskIncompleteRegions(
  chart: ChartPoint[],
  isStartIncomplete: boolean,
  isEndIncomplete: boolean,
): ChartPoint[] {
  return chart.map((point, index) => {
    const isFirst = index === 0;
    const isLast = index === chart.length - 1;

    // Mask primary value (index 0) for incomplete buckets
    if ((isFirst && isStartIncomplete) || (isLast && isEndIncomplete)) {
      return { ...point, value: [null, ...point.value.slice(1)] };
    }
    return point;
  });
}

function createComparisonMap(
  chartData: Array<{ date: number; value: number[] }>,
  compareChartData: Array<{ date: number; value: number[] }>,
  dataKey: string,
) {
  return chartData.map((currentPoint, index) => {
    const comparePoint = compareChartData[index];
    return {
      currentDate: currentPoint.date,
      compareDate: comparePoint.date,
      currentValues: { [dataKey]: currentPoint.value[0] },
      compareValues: { [dataKey]: comparePoint.value[0] },
    };
  });
}

export function toSparklineSeries<K extends string>({
  dataKey,
  data,
}: DataToAreaChartProps<K>): Array<{ date: Date } & Record<K, number>> {
  const area = dataToAreaChart({ dataKey, data });
  return area.map((p) => ({ date: new Date(p.date), [dataKey]: p.value[0] })) as Array<
    { date: Date } & Record<K, number>
  >;
}
