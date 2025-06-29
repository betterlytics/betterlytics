import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { utcDay, utcHour, utcMinute } from 'd3-time';
import { getDateKey } from '@/utils/dateHelpers';
import { type ComparisonMapping } from '@/types/charts';

const IntervalFunctions = {
  day: utcDay,
  hour: utcHour,
  minute: utcMinute,
} as const;

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
};

function normalizeIterationRange(dateRange: { start: Date; end: Date }, granularity: GranularityRangeValues) {
  if (granularity === 'day') {
    const startUTC = utcDay(dateRange.start);
    const endUTC = utcDay(dateRange.end);

    return { start: startUTC, end: endUTC };
  }

  return dateRange;
}

function dataToAreaChart<K extends string>({ dataKey, data, granularity, dateRange }: ToAreaChartProps<K>) {
  // Map date to value
  const groupedData = data.reduce(
    (group, row) => {
      const key = getDateKey(row.date);
      return { ...group, [key]: row[dataKey] };
    },
    {} as Record<string, number>,
  );

  const chartData = [];

  // Normalize iteration range to match ClickHouse aggregation
  const iterationRange = normalizeIterationRange(dateRange, granularity);

  // Find the time interval of input based on specified granularity
  const intervalFunc = IntervalFunctions[granularity];

  for (let time = iterationRange.start; time <= iterationRange.end; time = intervalFunc.offset(time, 1)) {
    const key = time.valueOf().toString();
    const value = groupedData[key] ?? 0;

    // Add entry - either with data from group or default value of 0
    chartData.push({
      date: +key,
      value: [value],
    });
  }

  return chartData;
}

type AreaChartResult = {
  data: Array<{ date: number; value: number[] }>;
  comparisonMap?: ComparisonMapping[];
};

export function toAreaChart<K extends string>({
  dataKey,
  data,
  compare,
  granularity,
  dateRange,
  compareDateRange,
}: ToAreaChartProps<K>): AreaChartResult {
  const chart = dataToAreaChart({
    dataKey,
    data,
    granularity,
    dateRange,
  });

  if (compare === undefined) {
    return { data: chart };
  }

  if (
    compareDateRange === undefined ||
    compareDateRange.start === undefined ||
    compareDateRange.end === undefined
  ) {
    throw 'Compare date range must be specified if compare data is received';
  }

  const compareChart = dataToAreaChart({
    dataKey,
    data: compare,
    granularity,
    dateRange: compareDateRange as {
      start: Date;
      end: Date;
    },
  });

  if (chart.length !== compareChart.length) {
    return { data: chart };
  }

  const chartData = chart.map((point, index) => ({
    date: point.date,
    value: [...point.value, ...compareChart[index].value],
  }));

  const comparisonMap = createComparisonMap(chartData, compareChart, dataKey);

  return {
    data: chartData,
    comparisonMap,
  };
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
