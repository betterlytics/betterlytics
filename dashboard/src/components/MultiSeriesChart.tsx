import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
  ReferenceLine,
  Label,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import MultiLineChartTooltip from './charts/MultiLineChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { defaultDateLabelFormatter, granularityDateFormatter } from '@/utils/chartUtils';

interface ChartDataPoint {
  date: string | number;
  value: number[];
}

export interface MultiSeriesConfig {
  dataKey: string; // e.g. 'value.0'
  stroke: string;
  strokeWidth?: number;
  dot?: boolean;
  name?: string;
}

interface MultiSeriesChartProps {
  title: React.ReactNode;
  data: ChartDataPoint[];
  granularity?: GranularityRangeValues;
  formatValue?: (value: number) => string;
  series: MultiSeriesConfig[];
  referenceLines?: Array<{
    y: number;
    label?: string;
    stroke?: string;
    strokeDasharray?: string;
    labelFill?: string;
  }>;
  headerRight?: React.ReactNode;
}

const MultiSeriesChart: React.FC<MultiSeriesChartProps> = React.memo(
  ({ title, data, granularity, formatValue, series, referenceLines, headerRight }) => {
    const axisFormatter = useMemo(() => granularityDateFormatter(granularity), [granularity]);
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-lg font-semibold'>
            <span className='inline-flex items-center gap-2'>{title}</span>
          </CardTitle>
          {headerRight && <div className='flex items-center gap-2'>{headerRight}</div>}
        </CardHeader>

        <CardContent className='pb-0'>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' className='opacity-10' />
                <XAxis
                  dataKey='date'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className='text-muted-foreground'
                  tickFormatter={(value) =>
                    axisFormatter(new Date(typeof value === 'number' ? value : Date.parse(String(value))))
                  }
                  minTickGap={100}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatValue ? formatValue : (value: number) => value.toLocaleString()}
                  className='text-muted-foreground'
                />

                <Tooltip
                  content={
                    <MultiLineChartTooltip
                      labelFormatter={(date) => defaultDateLabelFormatter(date, granularity)}
                      formatter={formatValue}
                    />
                  }
                />
                {series.map((s, idx) => (
                  <Line
                    key={`${s.dataKey}-${idx}`}
                    type='monotone'
                    dataKey={s.dataKey}
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth ?? 2}
                    dot={s.dot ?? false}
                    name={s.name}
                  />
                ))}
                {referenceLines?.map((r, i) => (
                  <ReferenceLine
                    key={`ref-${i}`}
                    y={r.y}
                    stroke={r.stroke ?? 'var(--chart-comparison)'}
                    strokeDasharray={r.strokeDasharray ?? '4 4'}
                  >
                    {r.label && (
                      <Label
                        value={r.label}
                        dy={-12}
                        position='insideLeft'
                        dx={8}
                        textAnchor='start'
                        fill={r.labelFill}
                      />
                    )}
                  </ReferenceLine>
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

MultiSeriesChart.displayName = 'MultiSeriesChart';

export default MultiSeriesChart;
