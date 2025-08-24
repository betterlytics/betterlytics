import { GranularityRangeValues } from '@/utils/granularityRanges';
import { scaleTime } from 'd3-scale';
import { utcDay } from 'd3-time';
import { getTimeIntervalForGranularity } from '@/utils/chartUtils';
import { timeFormat } from 'd3-time-format';
import { useMemo } from 'react';
import { getDateKey } from '@/utils/dateHelpers';

type FragmentedGranularityTimeSeriesLineChartProps<K extends string> = {
  dataKey: K;
  data: Array<{ date: string } & Record<K, number>>;
  granularity: GranularityRangeValues;
};

export function useFragmentedGranularityTimeSeriesLineChart<K extends string>({
  dataKey,
  data,
  granularity,
}: FragmentedGranularityTimeSeriesLineChartProps<K>) {
  // Map date to value
  const groupedData = useMemo(() => {
    return data.reduce(
      (group, row) => {
        const key = getDateKey(row.date);
        return { ...group, [key]: row[dataKey] };
      },
      {} as Record<string, number>,
    );
  }, [data, dataKey]);

  // Calculates upper and lower bound of time and values
  const timeSeries = useMemo(() => {
    const dates = Object.keys(groupedData).map((date) => +date);
    const values = Object.values(groupedData);
    return {
      minTime: Math.min(...dates),
      maxTime: Math.max(...dates),
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
    };
  }, [groupedData]);

  // Fill in the missing dates
  const chartData = useMemo(() => {
    const intervalFunc = getTimeIntervalForGranularity(granularity);

    const filled = [];
    // Iterate through each potential time frame
    for (
      let time = new Date(timeSeries.minTime);
      time <= new Date(timeSeries.maxTime);
      time = intervalFunc.offset(time, 1)
    ) {
      const key = getDateKey(time.toISOString());
      // Add entry - either with data from group or default value of 0
      filled.push({
        date: +key,
        [dataKey]: groupedData[key] ?? 0,
      });
    }
    return filled;
  }, [granularity, groupedData, timeSeries, dataKey]);

  // Render tooltip based on granularity
  const tooltipLabelFormatter = useMemo(() => {
    return {
      day: timeFormat('%B %d, %Y'),
      hour: timeFormat('%H:%M, %B %d, %Y'),
      minute_15: timeFormat('%H:%M, %B %d, %Y'),
      minute_30: timeFormat('%H:%M, %B %d, %Y'),
    }[granularity];
  }, [granularity]);

  // Generate scale for graph
  const scale = useMemo(
    () => scaleTime([timeSeries.minTime, timeSeries.maxTime], [timeSeries.minValue, timeSeries.maxValue]),
    [timeSeries],
  );

  // Generate list of "ticks"/labels to be added on the x-axis
  const ticks = useMemo(() => {
    return scale.ticks(utcDay.every(1)!) as unknown as number[]; // Recharts has incorrectly typed "ticks"
  }, [scale]);

  return {
    chartData,
    tooltipLabelFormatter,
    scale,
    ticks,
  };
}
