type DataToPieChartProps<K extends string, D extends string> = {
  key: K;
  dataKey: D;
  data: Array<Record<K, string> & Record<D, number>>;
};

type ToPieChartProps<K extends string, D extends string> = DataToPieChartProps<K, D> & {
  compare?: Array<Record<K, string> & Record<D, number>> | null;
};

function dataToPieChart<K extends string, D extends string>({ key, dataKey, data }: ToPieChartProps<K, D>) {
  // Map to format
  const baseChart = data.map((point) => ({
    name: point[key],
    value: [point[dataKey]],
  }));

  const total = baseChart.reduce((sum, d) => sum + d.value[0], 0) || 1;

  return baseChart.map((point) => ({
    ...point,
    percentage: (100 * point.value[0]) / total,
  }));
}

export function toPieChart<K extends string, D extends string>({
  key,
  dataKey,
  data,
  compare,
}: ToPieChartProps<K, D>) {
  const chart = dataToPieChart({
    key,
    dataKey,
    data,
  });

  if (compare === undefined || compare === null) {
    return chart;
  }

  const compareChart = dataToPieChart({
    key,
    dataKey,
    data: compare,
  });

  return chart.map((point, index) => ({
    name: point.name,
    value: [...point.value, ...(compareChart.find((comp) => comp.name === point.name)?.value ?? [0])],
    percentage: point.percentage,
  }));
}
