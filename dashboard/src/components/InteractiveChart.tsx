import React, { useMemo } from 'react';
import { ResponsiveContainer, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ChartTooltip } from './charts/ChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { type ComparisonMapping } from '@/types/charts';
import { defaultDateLabelFormatter, granularityDateFormatter } from '@/utils/chartUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNumber } from '@/utils/formatters';

interface ChartDataPoint {
  date: string | number;
  value: Array<number | null>;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  incomplete?: ChartDataPoint[];
  color: string;
  formatValue?: (value: number) => string;
  granularity?: GranularityRangeValues;
  comparisonMap?: ComparisonMapping[];
  headerContent?: React.ReactNode;
  tooltipTitle?: string;
  labelPaddingLeft?: number;
}

const InteractiveChart: React.FC<InteractiveChartProps> = React.memo(
  ({
    data,
    incomplete,
    color,
    formatValue,
    granularity,
    comparisonMap,
    headerContent,
    tooltipTitle,
    labelPaddingLeft,
  }) => {
    const axisFormatter = useMemo(() => granularityDateFormatter(granularity), [granularity]);
    const yTickFormatter = useMemo(() => {
      return (value: number) => {
        const text = formatValue ? formatValue(value) : formatNumber(value);
        return typeof text === 'string' ? text.replace(/\s/g, '\u00A0') : text;
      };
    }, [formatValue]);

    const isMobile = useIsMobile();
    return (
      <Card className='px-3 pt-2 pb-4 sm:px-2 sm:pt-4 sm:pb-5'>
        <CardContent className='p-0'>
          {headerContent && <div className='mb-5 p-0 sm:px-4'>{headerContent}</div>}
          <div className='h-80 py-1 sm:px-2 md:px-4'>
            <ResponsiveContainer width='100%' height='100%' className='mt-4'>
              <ComposedChart
                data={data}
                margin={{ top: 10, left: isMobile ? 0 : (labelPaddingLeft ?? 6), bottom: 0, right: 1 }}
              >
                <defs>
                  <linearGradient id={`gradient-value`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={color} stopOpacity={0.35} />
                    <stop offset='95%' stopColor={color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`gradient-incomplete`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={color} stopOpacity={0.09} />
                    <stop offset='95%' stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid className='opacity-10' vertical={false} strokeWidth={1.5} />
                <XAxis
                  dataKey='date'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className='text-muted-foreground'
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(value) =>
                    axisFormatter(new Date(typeof value === 'number' ? value : String(value)))
                  }
                  minTickGap={100}
                  tickMargin={6}
                  allowDuplicatedCategory={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  tickFormatter={yTickFormatter}
                  className='text-muted-foreground'
                  width={40}
                  mirror={isMobile}
                />

                <Tooltip
                  content={
                    <ChartTooltip
                      labelFormatter={(date) => defaultDateLabelFormatter(date, granularity)}
                      formatter={formatValue}
                      comparisonMap={comparisonMap}
                      title={tooltipTitle}
                    />
                  }
                />
                <Area
                  type='linear'
                  data={data}
                  dataKey={'value.0'}
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={'url(#gradient-value)'}
                />
                {incomplete && incomplete.length >= 2 ? (
                  <Area
                    type='linear'
                    data={incomplete}
                    dataKey={'value.0'}
                    stroke='none'
                    fillOpacity={1}
                    fill={'url(#gradient-incomplete)'}
                  />
                ) : null}
                {incomplete && incomplete.length >= 2 ? (
                  <Line
                    type='linear'
                    data={incomplete}
                    dataKey={'value.0'}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray='4 4'
                    dot={false}
                  />
                ) : null}
                <Line
                  type='linear'
                  dataKey={'value.1'}
                  stroke={'var(--chart-comparison)'}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                  dot={false}
                />
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
