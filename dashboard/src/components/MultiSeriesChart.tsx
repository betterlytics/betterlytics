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
import { useLocale } from 'next-intl';

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
    const locale = useLocale();
    const axisFormatter = useMemo(() => granularityDateFormatter(granularity, locale), [granularity, locale]);
    const yTickFormatter = useMemo(() => {
      return (value: number) => {
        const text = formatValue ? formatValue(value) : value.toLocaleString();
        return typeof text === 'string' ? text.replace(/\s/g, '\u00A0') : text;
      };
    }, [formatValue]);
    const isMobile = useIsMobile();

    return (
      <Card className='px-3 pt-2 pb-4 sm:px-2 sm:pt-4 sm:pb-5'>
        {(title || headerRight) && (
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-base font-medium'>
              <span className='inline-flex items-center gap-2'>{title}</span>
            </CardTitle>
            {headerRight && <div className='flex items-center gap-2'>{headerRight}</div>}
          </CardHeader>
        )}

        <CardContent className='p-0'>
          {headerContent && <div className='mb-2 p-0 sm:px-4'>{headerContent}</div>}
          <div className='h-80 py-1 md:px-4'>
            <ResponsiveContainer width='100%' height='100%' className='mt-0'>
              <ComposedChart data={data} margin={{ top: 10, left: isMobile ? 0 : 12, bottom: 0, right: 1 }}>
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
                      labelFormatter={(date) => defaultDateLabelFormatter(date, granularity, locale)}
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
                    key={`ref-${i}-${r.y}`}
                    y={r.y}
                    stroke={r.stroke ?? 'var(--chart-comparison)'}
                    strokeDasharray={r.strokeDasharray ?? '4 4'}
                    label={
                      r.label ? (
                        <ReferenceLineLabel text={r.label} fill={r.labelFill ?? r.stroke} isMobile={isMobile} />
                      ) : undefined
                    }
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

type ReferenceLineLabelProps = {
  text: string;
  fill?: string;
  isMobile: boolean;
  viewBox?: any;
};

const ReferenceLineLabel: React.FC<ReferenceLineLabelProps> = ({ text, fill, isMobile, viewBox }) => {
  const vb = viewBox || {};
  const x = (vb.x ?? 0) + (isMobile ? 32 : 8);
  const y = (vb.y ?? 0) - 8;
  const textFill = fill ?? 'var(--muted-foreground)';
  return (
    <g>
      <text
        x={x}
        y={y}
        fill={textFill}
        fontSize={12}
        textAnchor='start'
        style={{ paintOrder: 'stroke', stroke: 'var(--background)', strokeWidth: 3 }}
      >
        {text}
      </text>
    </g>
  );
};

ReferenceLineLabel.displayName = 'ReferenceLineLabel';
MultiSeriesChart.displayName = 'MultiSeriesChart';

export default MultiSeriesChart;
