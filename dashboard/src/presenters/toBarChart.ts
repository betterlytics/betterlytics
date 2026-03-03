import { getDateKey } from '@/utils/dateHelpers';

export type BarChartPoint = { date: number; count: number };

type ToBarChartProps<K extends string> = {
  dataKey: K;
  data: Array<{ date: string } & Record<K, number>>;
};

export function toBarChart<K extends string>({ dataKey, data }: ToBarChartProps<K>): BarChartPoint[] {
  return data.map((row) => ({
    date: Number(getDateKey(row.date)),
    count: row[dataKey],
  }));
}

type ToGroupedBarChartsProps<G extends string, K extends string> = {
  groupKey: G;
  dataKey: K;
  timeBuckets: BarChartPoint[];
  data: Array<{ date: string } & Record<G, string> & Record<K, number>>;
};

export function toGroupedBarCharts<G extends string, K extends string>({
  groupKey,
  dataKey,
  timeBuckets,
  data,
}: ToGroupedBarChartsProps<G, K>): Record<string, BarChartPoint[]> {
  const allBuckets = timeBuckets.map((p) => p.date);

  const sparse: Record<string, Map<number, number>> = {};
  for (const row of data) {
    const key = row[groupKey];
    if (!sparse[key]) sparse[key] = new Map();
    sparse[key].set(Number(getDateKey(row.date)), row[dataKey]);
  }

  const map: Record<string, BarChartPoint[]> = {};
  for (const [group, counts] of Object.entries(sparse)) {
    map[group] = allBuckets.map((date) => ({
      date,
      count: counts.get(date) ?? 0,
    }));
  }

  return map;
}
