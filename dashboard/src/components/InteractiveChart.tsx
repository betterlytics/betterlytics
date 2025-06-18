import React from 'react';
import {
  ResponsiveContainer,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
  TooltipProps,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface InteractiveChartProps {
  title: string;
  data: ChartDataPoint[];
  valueField: string;
  color: string;
  formatValue?: (value: number) => string;
  comparisonData?: ChartDataPoint[];
  comparisonValueField?: string;
  showComparison?: boolean;
}

const InteractiveChart: React.FC<InteractiveChartProps> = React.memo(
  ({
    title,
    data,
    valueField,
    color,
    formatValue,
    comparisonData,
    comparisonValueField,
    showComparison = false,
  }) => {
    const comparisonColor = 'var(--chart-comparison)';

    // Merge data is required format for recharts as it expects both data and comparison data to be in the same array.
    // Given that array length is the same, we can use the index to map the comparison data to the current data.
    const mergedData = React.useMemo(() => {
      if (!showComparison || !comparisonData || !comparisonValueField) {
        return data;
      }

      return data.map((item, index) => ({
        ...item,
        [`comparison_${comparisonValueField}`]: comparisonData[index]?.[comparisonValueField] || 0,
      }));
    }, [data, comparisonData, comparisonValueField, showComparison]);

    const comparisonDataKey = comparisonValueField ? `comparison_${comparisonValueField}` : '';

    const renderTooltipContent = React.useCallback(
      (props: TooltipProps<string | number, string>) => {
        const { active, payload, label } = props;
        if (!active || !payload || !payload.length) return null;

        const currentData = payload.find((p) => p.dataKey === valueField);
        const comparisonDataPayload = payload.find((p) => p.dataKey === comparisonDataKey);

        const currentIndex = mergedData.findIndex((item) => item.date === label);
        const comparisonDate = comparisonData && currentIndex >= 0 ? comparisonData[currentIndex]?.date : null;

        return (
          <div className='bg-popover border-border rounded-lg border p-3 shadow-lg'>
            <div className='mb-2'>
              <p className='text-muted-foreground text-xs'>{label}</p>
              <p className='text-foreground font-medium' style={{ color: currentData?.color }}>
                {currentData && formatValue
                  ? formatValue(currentData.value as number)
                  : (currentData?.value as number)?.toLocaleString()}
              </p>
            </div>

            {comparisonDataPayload && comparisonDate && showComparison && (
              <div>
                <p className='text-muted-foreground text-xs'>{comparisonDate}</p>
                <p className='text-foreground font-medium' style={{ color: comparisonDataPayload.color }}>
                  {formatValue
                    ? formatValue(comparisonDataPayload.value as number)
                    : (comparisonDataPayload.value as number).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        );
      },
      [valueField, comparisonDataKey, mergedData, comparisonData, formatValue, showComparison],
    );

    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
          {showComparison && (
            <div className='flex items-center gap-4 text-sm'>
              <div className='flex items-center gap-2'>
                <div className='h-0.5 w-3 rounded' style={{ backgroundColor: color }}></div>
                <span className='text-muted-foreground'>Current Period</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-0.5 w-3 rounded opacity-60' style={{ backgroundColor: comparisonColor }}></div>
                <span className='text-muted-foreground'>Comparison Period</span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className='pb-0'>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <ComposedChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${valueField}`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={color} stopOpacity={0.3} />
                    <stop offset='95%' stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='opacity-10' />
                <XAxis
                  dataKey='date'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className='text-muted-foreground'
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatValue ? formatValue : (value: number) => value.toLocaleString()}
                  className='text-muted-foreground'
                />
                <Tooltip content={renderTooltipContent} />

                <Area
                  type='monotone'
                  dataKey={valueField}
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#gradient-${valueField})`}
                />

                {showComparison && comparisonDataKey && (
                  <Line
                    type='monotone'
                    dataKey={comparisonDataKey}
                    stroke={comparisonColor}
                    strokeWidth={1.5}
                    strokeDasharray='4 4'
                    dot={false}
                    activeDot={{ r: 3, stroke: comparisonColor, strokeWidth: 1 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

InteractiveChart.displayName = 'InteractiveChart';

export default InteractiveChart;
