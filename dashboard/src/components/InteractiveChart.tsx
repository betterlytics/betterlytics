import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ChartTooltip } from './charts/ChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { type ComparisonMapping } from '@/types/charts';
import { defaultDateLabelFormatter, granularityDateFormatter } from '@/utils/chartUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNumber } from '@/utils/formatters';
import { useLocale } from 'next-intl';
import { Pencil, X } from 'lucide-react';
import { type ChartAnnotation } from './charts/AnnotationMarker';
import AnnotationDialogs, { type AnnotationDialogsRef } from './charts/AnnotationDialogs';
import AnnotationGroupMarker from './charts/AnnotationGroupMarker';
import AnnotationGroupPopover from './charts/AnnotationGroupPopover';
import { groupAnnotationsByBucket, type AnnotationGroup } from '@/utils/chartAnnotations';

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
  onUpdateAnnotation?: (
    id: string,
    updates: Pick<ChartAnnotation, 'label' | 'description' | 'colorToken' | 'date'>,
  ) => void;
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
    const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);
    const [isAnnotationMode, setIsAnnotationMode] = useState(false);
    const [chartWidth, setChartWidth] = useState<number>(800);
    const annotationDialogsRef = useRef<AnnotationDialogsRef>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // State for group popover
    const [openGroup, setOpenGroup] = useState<AnnotationGroup | null>(null);
    const [popoverAnchorRect, setPopoverAnchorRect] = useState<DOMRect | null>(null);

    const annotationGroups = useMemo(
      () => groupAnnotationsByBucket(annotations ?? [], data, chartWidth),
      [annotations, data, chartWidth],
    );

    const orderedAnnotationGroups = useMemo(() => {
      if (hoveredGroup === null) return annotationGroups;
      const hovered = annotationGroups.find((g) => g.bucketDate === hoveredGroup);
      if (!hovered) return annotationGroups;
      return [...annotationGroups.filter((g) => g.bucketDate !== hoveredGroup), hovered];
    }, [annotationGroups, hoveredGroup]);

    const axisFormatter = useMemo(() => granularityDateFormatter(granularity, locale), [granularity, locale]);
    const yTickFormatter = useMemo(() => {
      return (value: number) => {
        const text = formatValue ? formatValue(value) : formatNumber(value);
        return typeof text === 'string' ? text.replace(/\s/g, '\u00A0') : text;
      };
    }, [formatValue]);

    useEffect(() => {
      if (!chartContainerRef.current) return;

      const updateWidth = () => {
        const nextWidth = chartContainerRef.current?.getBoundingClientRect().width;
        if (nextWidth && Math.abs(nextWidth - chartWidth) > 0.5) {
          setChartWidth(nextWidth);
        }
      };

      updateWidth();

      let observer: ResizeObserver | null = null;

      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(updateWidth);
        observer.observe(chartContainerRef.current);
      } else {
        window.addEventListener('resize', updateWidth);
      }

      return () => {
        if (observer) {
          observer.disconnect();
        } else {
          window.removeEventListener('resize', updateWidth);
        }
      };
    }, [chartWidth]);

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

    const handleSingleAnnotationClick = useCallback((annotation: ChartAnnotation) => {
      annotationDialogsRef.current?.openEditDialog(annotation);
    }, []);

    const handleAddAnnotation = useCallback(
      (annotation: Omit<ChartAnnotation, 'id'>) => {
        onAddAnnotation?.(annotation);
        setIsAnnotationMode(false);
      },
      [onAddAnnotation],
    );

    const handleGroupClick = useCallback((group: AnnotationGroup, anchorRect: DOMRect) => {
      if (group.annotations.length === 1) {
        annotationDialogsRef.current?.openEditDialog(group.annotations[0]);
      } else {
        setOpenGroup(group);
        setPopoverAnchorRect(anchorRect);
      }
    }, []);

    const handleClosePopover = useCallback(() => {
      setOpenGroup(null);
      setPopoverAnchorRect(null);
    }, []);

    const handleEditFromPopover = useCallback((annotation: ChartAnnotation) => {
      annotationDialogsRef.current?.openEditDialog(annotation);
    }, []);

    const handleDeleteFromPopover = useCallback(
      (id: string) => {
        onDeleteAnnotation?.(id);
      },
      [onDeleteAnnotation],
    );

    const isMobile = useIsMobile();
    const [hoveredPillGroup, setHoveredPillGroup] = useState<number | null>(null);

    const renderChartTooltip = useCallback(
      (tooltipProps: any) => {
        if (hoveredPillGroup !== null) return null;
        return (
          <ChartTooltip
            {...tooltipProps}
            labelFormatter={(date) => defaultDateLabelFormatter(date, granularity, locale)}
            formatter={formatValue}
            comparisonMap={comparisonMap}
            title={tooltipTitle}
          />
        );
      },
      [hoveredPillGroup, granularity, locale, formatValue, comparisonMap, tooltipTitle],
    );

    return (
      <Card className='px-3 pt-2 pb-4 sm:px-2 sm:pt-4 sm:pb-5'>
        <CardContent className='p-0'>
          {headerContent && <div className='mb-5 p-0 sm:px-4'>{headerContent}</div>}
          <div ref={chartContainerRef} className='relative h-80 py-1 sm:px-2 md:px-4'>
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
                {isAnnotationMode ? (
                  <X className='h-4 w-4 cursor-pointer' />
                ) : (
                  <Pencil className='h-4 w-4 cursor-pointer' />
                )}
              </button>
            )}

            {isAnnotationMode && (
              <Badge
                variant='secondary'
                className='border-border/80 bg-secondary/90 text-foreground dark:bg-accent/95 absolute top-0 left-1/2 z-10 -translate-x-1/2 rounded-md border px-3 py-1 text-xs font-semibold shadow-md backdrop-blur-sm'
              >
                Click on the chart to add an annotation
              </Badge>
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

                <Tooltip content={renderChartTooltip} />

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
                {orderedAnnotationGroups.map((group) => (
                  <ReferenceDot
                    key={group.bucketDate}
                    x={group.bucketDate}
                    y={group.dataValue}
                    r={0}
                    isFront
                    shape={
                      <AnnotationGroupMarker
                        group={group}
                        isHovered={hoveredGroup === group.bucketDate}
                        onHover={setHoveredGroup}
                        onHoverPill={setHoveredPillGroup}
                        onGroupClick={handleGroupClick}
                        onSingleClick={handleSingleAnnotationClick}
                        isAnnotationMode={isAnnotationMode}
                      />
                    }
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>

            <AnnotationGroupPopover
              group={openGroup}
              anchorRect={popoverAnchorRect}
              containerRef={chartContainerRef}
              onClose={handleClosePopover}
              onEdit={handleEditFromPopover}
              onDelete={handleDeleteFromPopover}
            />
          </div>
        </CardContent>

        <AnnotationDialogs
          ref={annotationDialogsRef}
          onAddAnnotation={handleAddAnnotation}
          onUpdateAnnotation={onUpdateAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
        />
      </Card>
    );
  },
);

InteractiveChart.displayName = 'InteractiveChart';

export default InteractiveChart;
