import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { utcDay, utcHour, utcMinute } from 'd3-time';
import { getDateKey } from '@/utils/dateHelpers';
import { type ComparisonMapping } from '@/types/charts';

const IntervalFunctions = {
  day: utcDay,
  hour: utcHour,
  minute: utcMinute,
} as const;

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
  compare?: RawStackedData<CategoryKey, ValueKey>;
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
  const allCategories = categories || dataCategories;

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
  const { data, categoryKey, valueKey, categories, granularity, dateRange } = props;

  const { processedData, allCategories } = pivotRawData(data, categoryKey, valueKey, categories);

  const chartData: ChartDataPoint[] = [];

  const iterationRange = {
    start: utcMinute(dateRange.start),
    end: utcMinute(dateRange.end),
  };

  const intervalFunc = IntervalFunctions[granularity];

  for (let time = iterationRange.start; time <= iterationRange.end; time = intervalFunc.offset(time, 1)) {
    const key = time.valueOf().toString();
    const dataPoint: ChartDataPoint = {
      date: +key,
    };

    allCategories.forEach((category) => {
      dataPoint[category] = processedData[key]?.[category] || 0;
    });

    chartData.push(dataPoint);
  }

  return { chartData, categories: allCategories };
}

export function toStackedAreaChart<CategoryKey extends string, ValueKey extends string>(
  props: ToStackedAreaChartProps<CategoryKey, ValueKey>,
): StackedAreaChartResult {
  const { chartData, categories } = dataToStackedAreaChart(props);

  if (props.compare === undefined) {
    return { data: chartData, categories };
  }

  if (
    props.compareDateRange === undefined ||
    props.compareDateRange.start === undefined ||
    props.compareDateRange.end === undefined
  ) {
    throw 'Compare date range must be specified if compare data is received';
  }

  const compareProps: ToStackedAreaChartProps<CategoryKey, ValueKey> = {
    data: props.compare,
    categoryKey: props.categoryKey,
    valueKey: props.valueKey,
    categories: props.categories,
    granularity: props.granularity,
    dateRange: props.compareDateRange as { start: Date; end: Date },
  };

  const { chartData: compareChartData } = dataToStackedAreaChart(compareProps);

  if (chartData.length !== compareChartData.length) {
    return { data: chartData, categories };
  }

  const comparisonMap = createComparisonMap(chartData, compareChartData, categories);

  return {
    data: chartData,
    categories,
    comparisonMap,
  };
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
  if (!data || data.length === 0) {
    return {};
  }

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
  if (!data || data.length === 0) {
    return [];
  }

  const totals = categoryTotals || calculateCategoryTotals(data, categoryKey, valueKey);

  return Array.from(new Set(data.map((item) => item[categoryKey]))).sort(
    (a, b) => (totals[b] || 0) - (totals[a] || 0),
  );
}
