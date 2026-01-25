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
  ReferenceArea,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import MultiLineChartTooltip from './charts/MultiLineChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { defaultDateLabelFormatter, granularityDateFormatter } from '@/utils/chartUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  date: string | number;
  value: Array<number | null>;
}

export interface MultiSeriesConfig {
  dataKey: string; // e.g. 'value.0'
  stroke: string;
  strokeWidth?: number;
  dot?: boolean | object;
  name?: string;
  strokeDasharray?: string;
}

export interface ReferenceAreaConfig {
  x1: string | number;
  x2: string | number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeDasharray?: string;
}

export interface YReferenceAreaConfig {
  y1: number | 'dataMin';
  y2: number | 'dataMax';
  fill?: string;
  fillOpacity?: number;
  label?: string;
}

interface MultiSeriesChartProps {
  title: React.ReactNode;
  data: ChartDataPoint[];
  granularity?: GranularityRangeValues;
  formatValue?: (value: number) => string;
  series: ReadonlyArray<MultiSeriesConfig>;
  referenceAreas?: Array<ReferenceAreaConfig>;
  yReferenceAreas?: Array<YReferenceAreaConfig>;
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
  className?: string;
  contentClassName?: string;
  showSinglePoints?: boolean;
}

const MultiSeriesChart: React.FC<MultiSeriesChartProps> = React.memo(
  ({
    title,
    data,
    granularity,
    formatValue,
    series,
    referenceAreas,
    yReferenceAreas,
    referenceLines,
    headerRight,
    headerContent,
    yDomain,
    className,
    contentClassName,
    showSinglePoints,
  }) => {
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
      <Card className={cn('px-3 pt-2 pb-4 sm:px-2 sm:pt-4 sm:pb-5', className)}>
        {(title || headerRight) && (
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-base font-medium'>
              <span className='inline-flex items-center gap-2'>{title}</span>
            </CardTitle>
            {headerRight && <div className='flex items-center gap-2'>{headerRight}</div>}
          </CardHeader>
        )}

        <CardContent className={cn('p-0', contentClassName)}>
          {headerContent && <div className='mb-2 p-0 sm:px-4'>{headerContent}</div>}
          <div className='h-80 overflow-hidden py-1 md:px-4'>
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
                    dot={s.dot ?? (showSinglePoints ? LineDot : false)}
                    name={s.name}
                    strokeDasharray={s.strokeDasharray}
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
                {yReferenceAreas?.map((yArea, i) => (
                  <ReferenceArea
                    key={`y-ref-area-${yArea.y1}-${yArea.y2}-${i}`}
                    y1={yArea.y1}
                    y2={yArea.y2}
                    fill={yArea.fill ?? 'var(--chart-comparison)'}
                    fillOpacity={yArea.fillOpacity ?? 0.08}
                    label={yArea.label ? <ReferenceAreaLabel area={yArea} isMobile={isMobile} /> : undefined}
                    ifOverflow='hidden'
                  />
                ))}
                {referenceAreas?.map((referenceArea, i) => (
                  <ReferenceArea
                    key={`ref-area-${referenceArea.x1}-${referenceArea.x2}-${i}`}
                    x1={referenceArea.x1}
                    x2={referenceArea.x2}
                    y1={0}
                    y2={10000}
                    fill={referenceArea.fill ?? 'var(--chart-comparison)'}
                    fillOpacity={referenceArea.fillOpacity ?? 0.15}
                    stroke={referenceArea.stroke}
                    strokeDasharray={referenceArea.strokeDasharray}
                    ifOverflow='hidden'
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

type LineDotProps = {
  index: number;
  value: number | null;
  points: { value: number | null; x: number; y: number }[];
  stroke: string;
};
function LineDot({ index, value, points, stroke }: LineDotProps) {
  if (
    value !== null &&
    typeof points[index - 1]?.value !== 'number' &&
    typeof points[index + 1]?.value !== 'number'
  ) {
    return <circle key={index} cx={points[index].x} cy={points[index].y} r={2} stroke={stroke} strokeWidth={2} />;
  }
  return null;
}

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

type ReferenceAreaLabelProps = {
  viewBox?: { x: number; y: number; width: number; height: number };
  area: YReferenceAreaConfig;
  isMobile: boolean;
};
const ReferenceAreaLabel = (props: ReferenceAreaLabelProps) => {
  const { viewBox, area, isMobile } = props;

  if (!viewBox) return null;

  const { x, y, height } = viewBox;

  if (y + height < 0) return null;

  const yVisibleTop = Math.max(y, 0);
  const yVisibleBottom = y + height;
  const centerY = (yVisibleTop + yVisibleBottom) / 2;

  return (
    <text
      x={x + (isMobile ? 42 : 16)}
      y={centerY}
      dominantBaseline='middle'
      fill={area.fill ?? 'var(--muted-foreground)'}
      textAnchor='start'
      fontSize={11}
      className='pointer-events-none select-none'
      style={{
        fontWeight: 600,
        opacity: 0.5,
        letterSpacing: '0.05em',
        paintOrder: 'stroke',
        stroke: 'var(--background)',
        strokeWidth: 3,
      }}
    >
      {area.label}
    </text>
  );
};

ReferenceLineLabel.displayName = 'ReferenceLineLabel';
MultiSeriesChart.displayName = 'MultiSeriesChart';

export default MultiSeriesChart;
