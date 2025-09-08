'use client';
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  headerContent?: React.ReactNode;
  yDomain?: [number | 'dataMin' | 'auto', number | 'dataMax' | 'auto' | ((dataMax: number) => number)];
}

const MultiSeriesChart: React.FC<MultiSeriesChartProps> = React.memo(
  ({ title, data, granularity, formatValue, series, referenceLines, headerRight, headerContent, yDomain }) => {
    const axisFormatter = useMemo(() => granularityDateFormatter(granularity), [granularity]);
    const yTickFormatter = useMemo(() => {
      return (value: number) => {
        const text = formatValue ? formatValue(value) : value.toLocaleString();
        return typeof text === 'string' ? text.replace(/\s/g, '\u00A0') : text;
      };
    }, [formatValue]);
    const isMobile = useIsMobile();
    return (
      <Card className='pt-1 sm:pt-4'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-lg font-semibold'>
            <span className='inline-flex items-center gap-2'>{title}</span>
          </CardTitle>
          {headerRight && <div className='flex items-center gap-2'>{headerRight}</div>}
        </CardHeader>

        <CardContent className='p-0'>
          {headerContent && <div className='mb-5 p-0 sm:px-4'>{headerContent}</div>}
          <div className='h-80 px-2 py-1 md:px-4'>
            <ResponsiveContainer width='100%' height='100%' className='mt-4'>
              <ComposedChart
                data={data}
                margin={{ top: 10, right: isMobile ? 4 : 22, left: isMobile ? 4 : 22, bottom: 0 }}
              >
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
                  domain={yDomain}
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
                    key={`ref-${r.label}`}
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
