import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { type ComparisonMapping } from '@/types/charts';
import { parseClickHouseDate } from '@/utils/dateHelpers';

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
  bucketIncomplete?: boolean;
};

function dataToAreaChart<K extends string>({ dataKey, data }: Pick<DataToAreaChartProps<K>, 'dataKey' | 'data'>) {
  const groupedData = data.reduce(
    (group, row) => {
      const key = parseClickHouseDate(row.date).valueOf().toString();
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
  incomplete?: Array<{ date: number; value: Array<number | null> }>;
};

export function toAreaChart<K extends string>({
  dataKey,
  data,
  compare,
  compareDateRange,
  bucketIncomplete,
}: ToAreaChartProps<K>): AreaChartResult {
  const chart = dataToAreaChart({ dataKey, data });

  const now = Date.now();
  const {
    firstIncompleteIndex,
    shouldSplit,
    solid: solidCurrent,
    incomplete: currentIncomplete,
  } = getIncompleteSplit(chart, now, bucketIncomplete);

  if (!compare) {
    return { data: solidCurrent, incomplete: currentIncomplete };
  }

  if (!compareDateRange?.start || !compareDateRange?.end) {
    throw 'Compare date range must be specified if compare data is received';
  }

  const compareChart = dataToAreaChart({ dataKey, data: compare });

  if (chart.length !== compareChart.length) {
    return { data: solidCurrent, incomplete: currentIncomplete };
  }

  const chartData = chart.map((point, index) => ({
    date: point.date,
    value: [...point.value, ...compareChart[index].value],
  }));

  const comparisonMap = createComparisonMap(chartData, compareChart, dataKey);

  const dataSeries = shouldSplit ? maskPrimaryAfterIndex(chartData, firstIncompleteIndex) : chartData;

  const incomplete = currentIncomplete
    ? currentIncomplete.map((point, i) => ({
        date: point.date,
        value: [...point.value, ...compareChart[firstIncompleteIndex - 1 + i].value],
      }))
    : undefined;

  return { data: dataSeries, comparisonMap, incomplete };
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

function findFirstIncompleteIndexForChart(chart: ChartPoint[], nowTimestamp: number): number {
  for (let i = 0; i < chart.length; i++) {
    const bucketStart = chart[i].date;
    if (bucketStart > nowTimestamp) return i - 1;
  }
  return -1;
}

function splitSeriesForIncomplete(
  chart: ChartPoint[],
  firstIncompleteIndex: number,
): { solid: ChartPoint[]; incomplete: ChartPoint[] | undefined } {
  if (firstIncompleteIndex === -1) return { solid: chart, incomplete: undefined };
  const startIndex = firstIncompleteIndex > 0 ? firstIncompleteIndex - 1 : 0;
  return {
    solid: chart.slice(0, firstIncompleteIndex),
    incomplete: chart.slice(startIndex, firstIncompleteIndex + 1),
  };
}

function maskPrimaryAfterIndex(chart: ChartPoint[], firstIncompleteIndex: number): ChartPoint[] {
  if (firstIncompleteIndex === -1) return chart;
  return chart.map((point, index) =>
    index >= firstIncompleteIndex ? { ...point, value: [null, ...point.value.slice(1)] } : point,
  );
}

function getIncompleteSplit(
  chart: ChartPoint[],
  nowTimestamp: number,
  bucketIncomplete?: boolean,
): {
  firstIncompleteIndex: number;
  shouldSplit: boolean;
  solid: ChartPoint[];
  incomplete: ChartPoint[] | undefined;
} {
  const firstIncompleteIndex = findFirstIncompleteIndexForChart(chart, nowTimestamp);
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

export function toSparklineSeries<K extends string>({
  dataKey,
  data,
}: DataToAreaChartProps<K>): Array<{ date: Date } & Record<K, number>> {
  const area = dataToAreaChart({ dataKey, data });
  return area.map((p) => ({ date: new Date(p.date), [dataKey]: p.value[0] })) as Array<
    { date: Date } & Record<K, number>
  >;
}
