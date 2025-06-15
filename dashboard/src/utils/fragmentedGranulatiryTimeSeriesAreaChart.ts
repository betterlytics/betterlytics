import { type GranularityRangeValues } from './granularityRanges';
import { utcDay, utcHour, utcMinute } from 'd3-time';

const IntervalFunctions = {
  day: utcDay,
  hour: utcHour,
  minute: utcMinute,
} as const;

type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

type LiteralObject<K> = {
  [P in StringLiteral<K>]: number;
};

type FragmentedGranularityTimeSeriesAreaChartProps<K extends string> = {
  dataKey: StringLiteral<K>;
  data: Array<{ date: string } & Record<K, number>>;
  granularity: GranularityRangeValues;
};

export function fromFragmentedGranularityTimeSeriesToLineChartAreaChart<K extends string>({
  dataKey,
  data,
  granularity,
}: FragmentedGranularityTimeSeriesAreaChartProps<K>) {
  // Map date to value
  const groupedData = data.reduce(
    (group, row) => {
      const key = new Date(row.date).valueOf().toString();
      return { ...group, [key]: row[dataKey] };
    },
    {} as Record<string, number>,
  );

  // Calculates upper and lower bound of time and values
  const dates = Object.keys(groupedData).map((date) => +date);
  const values = Object.values(groupedData);
  const timeSeries = {
    minTime: Math.min(...dates),
    maxTime: Math.max(...dates),
    minValue: Math.min(...values),
    maxValue: Math.max(...values),
  };

  const chartData = [];

  // Find the time interval of input based on specified granularity
  const intervalFunc = IntervalFunctions[granularity];
  // Iterate through each potential time frame
  for (
    let time = new Date(timeSeries.minTime);
    time <= new Date(timeSeries.maxTime);
    time = intervalFunc.offset(time, 1)
  ) {
    const key = time.valueOf().toString();
    // Add entry - either with data from group or default value of 0
    chartData.push({
      date: +key,
      [dataKey]: groupedData[key] ?? 0,
    });
  }

  return chartData as ({ date: number } & LiteralObject<K>)[];
}
