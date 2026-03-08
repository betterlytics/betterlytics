import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { type ComparisonMapping } from '@/types/charts';
import { getDateKey } from '@/utils/dateHelpers';

type RawStackedData<CategoryKey extends string, ValueKey extends string> = Array<
  { date: string } & Record<CategoryKey, string> & Record<ValueKey, number>
>;

type ToStackedAreaChartProps<CategoryKey extends string, ValueKey extends string> = {
  data: RawStackedData<CategoryKey, ValueKey>;
  categoryKey: CategoryKey;
  valueKey: ValueKey;
  categories?: string[];
  granularity: GranularityRangeValues;
  dateRange: {
    start: Date;
    end: Date;
  };
  compare?: RawStackedData<CategoryKey, ValueKey> | null;
  compareDateRange?: {
    start?: Date;
    end?: Date;
  };
};

type ChartDataPoint = {
  date: number;
} & Record<string, number>;

type StackedAreaChartResult = {
  data: ChartDataPoint[];
  categories: string[];
  comparisonMap?: ComparisonMapping[];
};

function pivotRawData<CategoryKey extends string, ValueKey extends string>(
  data: RawStackedData<CategoryKey, ValueKey>,
  categoryKey: CategoryKey,
  valueKey: ValueKey,
  categories?: string[],
): { processedData: Record<string, Record<string, number>>; allCategories: string[] } {
  const dataCategories = Array.from(new Set(data.map((item) => item[categoryKey])));
  const allCategories = (categories || dataCategories).filter(Boolean);

  const processedData: Record<string, Record<string, number>> = {};

  data.forEach((item) => {
    const dateKey = getDateKey(item.date);
    const category = item[categoryKey];
    const value = item[valueKey];

    if (!processedData[dateKey]) {
      processedData[dateKey] = {};
      allCategories.forEach((cat) => {
        processedData[dateKey][cat] = 0;
      });
    }

    processedData[dateKey][category] = value;
  });

  return { processedData, allCategories };
}

function dataToStackedAreaChart<CategoryKey extends string, ValueKey extends string>(
  props: ToStackedAreaChartProps<CategoryKey, ValueKey>,
) {
  const { data, categoryKey, valueKey, categories } = props;

  const { processedData, allCategories } = pivotRawData(data, categoryKey, valueKey, categories);

  const chartData: ChartDataPoint[] = Object.entries(processedData)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, values]) => ({
      date: Number(key),
      ...values,
    }));

  return { chartData, categories: allCategories };
}

export function toStackedAreaChart<CategoryKey extends string, ValueKey extends string>(
  props: ToStackedAreaChartProps<CategoryKey, ValueKey>,
): StackedAreaChartResult {
  const { chartData, categories } = dataToStackedAreaChart(props);

  if (!props.compare) {
    return { data: chartData, categories };
  }

  const { compare, compareDateRange, categoryKey, valueKey, granularity } = props;

  if (!compareDateRange?.start || !compareDateRange?.end) {
    throw 'Compare date range must be specified if compare data is received';
  }

  const compareProps: ToStackedAreaChartProps<CategoryKey, ValueKey> = {
    data: compare,
    categoryKey,
    valueKey,
    categories,
    granularity,
    dateRange: compareDateRange as { start: Date; end: Date },
  };

  const { chartData: compareChartData } = dataToStackedAreaChart(compareProps);

  if (chartData.length !== compareChartData.length) {
    return { data: chartData, categories };
  }

  const comparisonMap = createComparisonMap(chartData, compareChartData, categories);
  return { data: chartData, categories, comparisonMap };
}

function createComparisonMap(
  chartData: ChartDataPoint[],
  compareChartData: ChartDataPoint[],
  categories: string[],
): ComparisonMapping[] {
  return chartData.map((currentPoint, index) => {
    const comparePoint = compareChartData[index];

    const currentValues: Record<string, number> = {};
    const compareValues: Record<string, number> = {};

    categories.forEach((category) => {
      currentValues[category] = currentPoint[category] || 0;
      compareValues[category] = comparePoint[category] || 0;
    });

    return {
      currentDate: currentPoint.date,
      compareDate: comparePoint.date,
      currentValues,
      compareValues,
    };
  });
}

function calculateCategoryTotals<CategoryKey extends string, ValueKey extends string>(
  data: RawStackedData<CategoryKey, ValueKey>,
  categoryKey: CategoryKey,
  valueKey: ValueKey,
): Record<string, number> {
  if (!data || data.length === 0) return {};

  return data.reduce(
    (acc, item) => {
      const category = item[categoryKey];
      acc[category] = (acc[category] || 0) + item[valueKey];
      return acc;
    },
    {} as Record<string, number>,
  );
}

export function getSortedCategories<CategoryKey extends string, ValueKey extends string>(
  data: RawStackedData<CategoryKey, ValueKey>,
  categoryKey: CategoryKey,
  valueKey: ValueKey,
  categoryTotals?: Record<string, number>,
): string[] {
  if (!data || data.length === 0) return [];

  const totals = categoryTotals || calculateCategoryTotals(data, categoryKey, valueKey);

  return Array.from(new Set(data.map((item) => item[categoryKey]))).sort(
    (a, b) => (totals[b] || 0) - (totals[a] || 0),
  );
}
