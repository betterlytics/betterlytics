import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { utcDay, utcHour, utcMinute } from 'd3-time';

const IntervalFunctions = {
  day: utcDay,
  hour: utcHour,
  minute: utcMinute,
} as const;

type DataPoint<K extends string, D extends string> = { date: string } & Record<K, string> & Record<D, number>;

type DataToStackedChartProps<K extends string, D extends string> = {
  key: K;
  dataKey: D;
  data: Array<DataPoint<K, D>>;
  granularity: GranularityRangeValues;
  dateRange: {
    start: Date;
    end: Date;
  };
};

type ToStackedChartProps<K extends string, D extends string> = DataToStackedChartProps<K, D> & {
  compare?: Array<DataPoint<K, D>>;
  compareDateRange?: {
    start?: Date;
    end?: Date;
  };
};

const calculateTypeTotals = <K extends string, D extends string>(
  data: Array<DataPoint<K, D>>,
  key: K,
  dataKey: D,
): Record<string, number> => {
  if (!data || data.length === 0) {
    return {};
  }
  return data.reduce(
    (acc, item) => {
      acc[item[key]] = (acc[item[key]] || 0) + item[dataKey];
      return acc;
    },
    {} as Record<string, number>,
  );
};

function dataToStackedChart<K extends string, D extends string>({
  key,
  dataKey,
  data,
  granularity,
  dateRange,
}: ToStackedChartProps<K, D>) {
  const totals = calculateTypeTotals(data, key, dataKey);
  const keys = [...new Set(data.map((row) => row[key]))].sort((a, z) => totals[z] - totals[a]) as string[];
  const emptyPoint = Array.from({ length: keys.length }).fill(0);

  // Map date to value
  const groupedData = data.reduce(
    (group, row) => {
      const dateKey = new Date(row.date).valueOf().toString();
      const groupedData = group[dateKey] ?? emptyPoint;

      return {
        ...group,
        [dateKey]: groupedData.toSpliced(keys.indexOf(row[key]), 1, row[dataKey]),
      };
    },
    {} as Record<string, number[]>,
  );

  console.log(groupedData);

  const chartData = [];

  // Find the time interval of input based on specified granularity
  const intervalFunc = IntervalFunctions[granularity];
  // Iterate through each potential time frame
  for (let time = dateRange.start; time <= dateRange.end; time = intervalFunc.offset(time, 1)) {
    const dateKey = time.valueOf().toString();
    // Add entry - either with data from group or default value of 0
    chartData.push({
      date: +dateKey,
      value: groupedData[dateKey] ?? emptyPoint,
    });
  }

  return {
    data: chartData,
    sortedKeys: keys,
    totals,
  };
}

export function toStackedChart<K extends string, D extends string>({
  key,
  dataKey,
  data,
  compare,
  granularity,
  dateRange,
  compareDateRange,
}: ToStackedChartProps<K, D>) {
  const chart = dataToStackedChart({
    key,
    dataKey,
    data,
    granularity,
    dateRange,
  });

  if (compare === undefined) {
    return chart;
  }

  if (
    compareDateRange === undefined ||
    compareDateRange.start === undefined ||
    compareDateRange.end === undefined
  ) {
    throw 'Compare date range must be specified if compare data is received';
  }

  const compareChart = dataToStackedChart({
    key,
    dataKey,
    data: compare,
    granularity,
    dateRange: compareDateRange as {
      start: Date;
      end: Date;
    },
  });

  if (chart.data.length !== compareChart.data.length) {
    return chart;
  }

  return {
    ...chart,
    data: chart.data.map((point, index) => ({
      date: point.date,
      value: [...point.value, ...compareChart.data[index].value],
    })),
  };
}
