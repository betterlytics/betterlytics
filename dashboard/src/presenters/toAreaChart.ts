import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { utcDay, utcHour, utcMinute } from 'd3-time';
import { getDateKey } from '@/utils/dateHelpers';
import { createTimezoneHelper, UTCDate } from '@/utils/timezoneHelpers';

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
    start: UTCDate;
    end: UTCDate;
  };
  userTimezone?: string;
};

type ToAreaChartProps<K extends string> = DataToAreaChartProps<K> & {
  compare?: Array<{ date: string } & Record<K, number>>;
  compareDateRange?: {
    start?: UTCDate;
    end?: UTCDate;
  };
};

function normalizeIterationRange(
  dateRange: { start: UTCDate; end: UTCDate },
  granularity: GranularityRangeValues,
  userTimezone = 'UTC',
) {
  const helper = createTimezoneHelper(userTimezone);

  const startBoundary = helper.getGranularityBoundaries(dateRange.start, granularity).start;
  const endBoundary = helper.getGranularityBoundaries(dateRange.end, granularity).start;

  return { start: startBoundary, end: endBoundary };
}

function dataToAreaChart<K extends string>({
  dataKey,
  data,
  granularity,
  dateRange,
  userTimezone = 'UTC',
}: DataToAreaChartProps<K>) {
  // Map date to value
  const groupedData = data.reduce(
    (group, row) => {
      const key = getDateKey(row.date);
      return { ...group, [key]: row[dataKey] };
    },
    {} as Record<string, number>,
  );

  const chartData = [];

  // Normalize iteration range to match ClickHouse aggregation using user timezone
  const iterationRange = normalizeIterationRange(dateRange, granularity, userTimezone);

  // Find the time interval of input based on specified granularity
  const intervalFunc = IntervalFunctions[granularity];
  const helper = createTimezoneHelper(userTimezone);

  for (
    let time = iterationRange.start;
    time <= iterationRange.end;
    time = intervalFunc.offset(time, 1) as UTCDate
  ) {
    // Ensure the time boundary aligns with user timezone
    const timezoneBoundary = helper.getGranularityBoundaries(time, granularity).start;
    const key = timezoneBoundary.valueOf().toString();
    const value = groupedData[key] ?? 0;

    // Add entry - either with data from group or default value of 0
    chartData.push({
      date: +key,
      value: [value],
    });
  }

  return chartData;
}

export function toAreaChart<K extends string>({
  dataKey,
  data,
  compare,
  granularity,
  dateRange,
  compareDateRange,
  userTimezone = 'UTC',
}: ToAreaChartProps<K>) {
  const chart = dataToAreaChart({
    dataKey,
    data,
    granularity,
    dateRange,
    userTimezone,
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

  const compareChart = dataToAreaChart({
    dataKey,
    data: compare,
    granularity,
    dateRange: compareDateRange as {
      start: UTCDate;
      end: UTCDate;
    },
    userTimezone,
  });

  if (chart.length !== compareChart.length) {
    return chart;
  }

  return chart.map((point, index) => ({
    date: point.date,
    value: [...point.value, ...compareChart[index].value],
  }));
}
