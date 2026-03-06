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
  timeBuckets: TimeSeriesPoint[];
  data: Array<{ date: string } & Record<G, string> & Record<K, number>>;
};

export function toGroupedTimeSeries<G extends string, K extends string>({
  groupKey,
  dataKey,
  timeBuckets,
  data,
}: ToGroupedTimeSeriesProps<G, K>): Record<string, TimeSeriesPoint[]> {
  const allBuckets = timeBuckets.map((p) => p.date);

  const sparse: Record<string, Map<number, number>> = {};
  for (const row of data) {
    const key = row[groupKey];
    if (!sparse[key]) sparse[key] = new Map();
    sparse[key].set(Number(getDateKey(row.date)), row[dataKey]);
  }

  const map: Record<string, TimeSeriesPoint[]> = {};
  for (const [group, counts] of Object.entries(sparse)) {
    map[group] = allBuckets.map((date) => ({
      date,
      count: counts.get(date) ?? 0,
    }));
  }

  return map;
}
