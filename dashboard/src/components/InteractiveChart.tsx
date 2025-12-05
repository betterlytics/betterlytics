import React, { useMemo, useState, useCallback, useRef } from 'react';
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
import { Pencil, X } from 'lucide-react';
import AnnotationMarker, { type ChartAnnotation } from './charts/AnnotationMarker';
import AnnotationDialogs, { type AnnotationDialogsRef } from './charts/AnnotationDialogs';

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
  onAddAnnotation?: (annotation: Omit<ChartAnnotation, 'id'>) => void;
  onUpdateAnnotation?: (id: string, updates: Pick<ChartAnnotation, 'label' | 'description' | 'color'>) => void;
  onDeleteAnnotation?: (id: string) => void;
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
    onAddAnnotation,
    onUpdateAnnotation,
    onDeleteAnnotation,
  }) => {
    const locale = useLocale();
    const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
    const [isAnnotationMode, setIsAnnotationMode] = useState(false);
    const annotationDialogsRef = useRef<AnnotationDialogsRef>(null);

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

    const handleChartClick = useCallback(
      (chartEvent: { activeLabel?: string | number } | null) => {
        if (!isAnnotationMode || !chartEvent?.activeLabel) return;

        const clickedDate =
          typeof chartEvent.activeLabel === 'number'
            ? chartEvent.activeLabel
            : new Date(chartEvent.activeLabel).getTime();

        annotationDialogsRef.current?.openCreateDialog(clickedDate);
      },
      [isAnnotationMode],
    );

    const handleAnnotationClick = useCallback(
      (annotation: ChartAnnotation) => {
        if (isAnnotationMode) return; // Don't open edit when in annotation mode
        annotationDialogsRef.current?.openEditDialog(annotation);
      },
      [isAnnotationMode],
    );

    const isMobile = useIsMobile();
    return (
      <Card className='px-3 pt-2 pb-4 sm:px-2 sm:pt-4 sm:pb-5'>
        <CardContent className='p-0'>
          {headerContent && <div className='mb-5 p-0 sm:px-4'>{headerContent}</div>}
          <div className='relative h-80 py-1 sm:px-2 md:px-4'>
            {onAddAnnotation && (
              <button
                onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                className={`absolute top-0 right-0 z-10 rounded-md p-1.5 transition-colors ${
                  isAnnotationMode
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={isAnnotationMode ? 'Exit annotation mode' : 'Add annotation'}
              >
                {isAnnotationMode ? <X className='h-4 w-4' /> : <Pencil className='h-4 w-4' />}
              </button>
            )}

            {isAnnotationMode && (
              <div className='bg-primary/10 text-primary absolute top-0 left-1/2 z-10 -translate-x-1/2 rounded-b-md px-3 py-1 text-xs font-medium'>
                Click on the chart to add an annotation
              </div>
            )}
            <ResponsiveContainer width='100%' height='100%' className='mt-4'>
              <ComposedChart
                data={data}
                margin={{ top: 10, left: isMobile ? 0 : (labelPaddingLeft ?? 6), bottom: 0, right: 1 }}
                onClick={isAnnotationMode ? handleChartClick : undefined}
                style={{ cursor: isAnnotationMode ? 'crosshair' : undefined }}
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
                          onClick={handleAnnotationClick}
                        />
                      }
                    />
                  ) : null,
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>

        <AnnotationDialogs
          ref={annotationDialogsRef}
          onAddAnnotation={onAddAnnotation}
          onUpdateAnnotation={onUpdateAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
        />
      </Card>
    );
  },
);

InteractiveChart.displayName = 'InteractiveChart';

export default InteractiveChart;
