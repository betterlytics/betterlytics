import { getDateKey } from '@/utils/dateHelpers';

export type TimeSeriesPoint = { date: number; count: number };

type ToTimeSeriesProps<K extends string> = {
  dataKey: K;
  data: Array<{ date: string } & Record<K, number>>;
};

export function toTimeSeries<K extends string>({ dataKey, data }: ToTimeSeriesProps<K>): TimeSeriesPoint[] {
  return data.map((row) => ({
    date: Number(getDateKey(row.date)),
    count: row[dataKey],
  }));
}

type ToGroupedTimeSeriesProps<G extends string, K extends string> = {
  groupKey: G;
  dataKey: K;
  data: Array<{ date: string } & Record<G, string> & Record<K, number>>;
};

export function toGroupedTimeSeries<G extends string, K extends string>({
  groupKey,
  dataKey,
  data,
}: ToGroupedTimeSeriesProps<G, K>): Record<string, TimeSeriesPoint[]> {
  const sparse: Record<string, TimeSeriesPoint[]> = {};
  for (const row of data) {
    const key = row[groupKey];
    if (!sparse[key]) sparse[key] = [];
    sparse[key].push({ date: Number(getDateKey(row.date)), count: row[dataKey] });
  }

  return sparse;
}
