import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
  ReferenceDot,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ChartTooltip } from './charts/ChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { type ComparisonMapping } from '@/types/charts';
import { defaultDateLabelFormatter, granularityDateFormatter } from '@/utils/chartUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNumber } from '@/utils/formatters';
import { useLocale } from 'next-intl';

// Annotation types for the chart
export interface ChartAnnotation {
  id: string;
  date: number; // timestamp
  label: string;
  description?: string;
  color?: string;
}

// Internal type with computed value for positioning
interface AnnotationWithValue extends ChartAnnotation {
  dataValue: number | null;
}

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
  annotations?: ChartAnnotation[];
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
    annotations,
  }) => {
    const locale = useLocale();
    const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);

    const annotationsWithValues: AnnotationWithValue[] = useMemo(() => {
      if (!annotations || !data) return [];
      return annotations.map((annotation) => {
        // Find the data point matching this annotation's date
        const dataPoint = data.find((d) => {
          const dataDate = typeof d.date === 'number' ? d.date : new Date(d.date).getTime();
          return dataDate === annotation.date;
        });
        return {
          ...annotation,
          dataValue: dataPoint?.value?.[0] ?? null,
        };
      });
    }, [annotations, data]);

    const axisFormatter = useMemo(() => granularityDateFormatter(granularity, locale), [granularity, locale]);
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
                      labelFormatter={(date) => defaultDateLabelFormatter(date, granularity, locale)}
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
                {/* Annotations - using ReferenceDot with custom shape */}
                {annotationsWithValues.map((annotation) =>
                  annotation.dataValue !== null ? (
                    <ReferenceDot
                      key={annotation.id}
                      x={annotation.date}
                      y={annotation.dataValue}
                      r={0} // We'll draw our own dot in the shape
                      shape={
                        <AnnotationMarker
                          annotation={annotation}
                          isHovered={hoveredAnnotation === annotation.id}
                          onHover={setHoveredAnnotation}
                        />
                      }
                    />
                  ) : null,
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

// Complete annotation marker: dot on line + dashed line up to pill + pill label
interface AnnotationMarkerProps {
  annotation: AnnotationWithValue;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  cx?: number; // X position of the data point (from ReferenceDot)
  cy?: number; // Y position of the data point (from ReferenceDot)
}

const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({ annotation, isHovered, onHover, cx = 0, cy = 0 }) => {
  const pillColor = annotation.color ?? '#f59e0b';
  const pillY = 8; // Fixed Y position for the pill near top
  const pillHeight = 22;
  const pillRadius = 11;

  // Approximate text width for pill sizing
  const textWidth = annotation.label.length * 6.5 + 16;

  // Line goes from bottom of pill to the dot on the chart line
  const lineStartY = pillY + pillHeight / 2;
  const lineEndY = cy;

  return (
    <g
      onMouseEnter={() => onHover(annotation.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      {/* Dashed line from pill to data point */}
      <line
        x1={cx}
        y1={lineStartY}
        x2={cx}
        y2={lineEndY}
        stroke={pillColor}
        strokeWidth={2}
        strokeDasharray='4 4'
        opacity={0.8}
      />

      {/* Dot on the chart line */}
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 6 : 5}
        fill={pillColor}
        stroke='white'
        strokeWidth={2}
        style={{ filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none' }}
      />

      {/* Pill background */}
      <rect
        x={cx - textWidth / 2}
        y={pillY - pillHeight / 2}
        width={textWidth}
        height={pillHeight}
        rx={pillRadius}
        ry={pillRadius}
        fill={pillColor}
        opacity={isHovered ? 1 : 0.9}
        style={{ filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none' }}
      />

      {/* Label text */}
      <text x={cx} y={pillY + 4} textAnchor='middle' fill='white' fontSize={11} fontWeight={500}>
        {annotation.label}
      </text>

      {/* Expanded tooltip on hover */}
      {isHovered && annotation.description && (
        <g>
          <rect
            x={cx - 90}
            y={pillY + pillHeight / 2 + 8}
            width={180}
            height={32}
            rx={6}
            fill='var(--popover, #1f2937)'
            stroke='var(--border, #374151)'
            strokeWidth={1}
          />
          <text
            x={cx}
            y={pillY + pillHeight / 2 + 28}
            textAnchor='middle'
            fill='var(--popover-foreground, #f3f4f6)'
            fontSize={11}
          >
            {annotation.description}
          </text>
        </g>
      )}
    </g>
  );
};

AnnotationMarker.displayName = 'AnnotationMarker';

export default InteractiveChart;
