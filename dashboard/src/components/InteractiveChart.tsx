import React, { useMemo, useState, useCallback } from 'react';
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
import { Pencil, X, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ChartAnnotation {
  id: string;
  date: number;
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

    // Annotation mode state
    const [isAnnotationMode, setIsAnnotationMode] = useState(false);
    const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
    const [pendingAnnotationDate, setPendingAnnotationDate] = useState<number | null>(null);
    const [annotationName, setAnnotationName] = useState('');

    // Edit annotation state
    const [selectedAnnotation, setSelectedAnnotation] = useState<ChartAnnotation | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editAnnotationName, setEditAnnotationName] = useState('');
    const [editAnnotationDescription, setEditAnnotationDescription] = useState('');

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

        setPendingAnnotationDate(clickedDate);
        setAnnotationName('');
        setShowAnnotationDialog(true);
      },
      [isAnnotationMode],
    );

    const handleCreateAnnotation = useCallback(() => {
      if (!pendingAnnotationDate || !annotationName.trim() || !onAddAnnotation) return;

      onAddAnnotation({
        date: pendingAnnotationDate,
        label: annotationName.trim(),
      });

      setShowAnnotationDialog(false);
      setPendingAnnotationDate(null);
      setAnnotationName('');
      setIsAnnotationMode(false);
    }, [pendingAnnotationDate, annotationName, onAddAnnotation]);

    const handleAnnotationClick = useCallback(
      (annotation: ChartAnnotation) => {
        if (isAnnotationMode) return; // Don't open edit when in annotation mode
        setSelectedAnnotation(annotation);
        setEditAnnotationName(annotation.label);
        setEditAnnotationDescription(annotation.description ?? '');
        setShowEditDialog(true);
      },
      [isAnnotationMode],
    );

    const handleUpdateAnnotation = useCallback(() => {
      if (!selectedAnnotation || !editAnnotationName.trim() || !onUpdateAnnotation) return;

      onUpdateAnnotation(selectedAnnotation.id, {
        label: editAnnotationName.trim(),
        description: editAnnotationDescription.trim() || undefined,
        color: selectedAnnotation.color,
      });

      setShowEditDialog(false);
      setSelectedAnnotation(null);
      setEditAnnotationName('');
      setEditAnnotationDescription('');
    }, [selectedAnnotation, editAnnotationName, editAnnotationDescription, onUpdateAnnotation]);

    const handleDeleteAnnotation = useCallback(() => {
      if (!selectedAnnotation || !onDeleteAnnotation) return;

      onDeleteAnnotation(selectedAnnotation.id);

      setShowEditDialog(false);
      setSelectedAnnotation(null);
      setEditAnnotationName('');
      setEditAnnotationDescription('');
    }, [selectedAnnotation, onDeleteAnnotation]);

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

        <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Add Annotation</DialogTitle>
            </DialogHeader>
            <div className='py-4'>
              <Input
                placeholder='Annotation name (e.g., "Product Launch")'
                value={annotationName}
                onChange={(e) => setAnnotationName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && annotationName.trim()) {
                    handleCreateAnnotation();
                  }
                }}
                autoFocus
              />
              {pendingAnnotationDate && (
                <p className='text-muted-foreground mt-2 text-sm'>
                  Date: {new Date(pendingAnnotationDate).toLocaleDateString(locale)}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowAnnotationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAnnotation} disabled={!annotationName.trim()}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Edit Annotation</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div>
                <label className='text-sm font-medium'>Name</label>
                <Input
                  placeholder='Annotation name'
                  value={editAnnotationName}
                  onChange={(e) => setEditAnnotationName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editAnnotationName.trim()) {
                      handleUpdateAnnotation();
                    }
                  }}
                  autoFocus
                  className='mt-1.5'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Description (optional)</label>
                <Input
                  placeholder='Add a description...'
                  value={editAnnotationDescription}
                  onChange={(e) => setEditAnnotationDescription(e.target.value)}
                  className='mt-1.5'
                />
              </div>
              {selectedAnnotation && (
                <p className='text-muted-foreground text-sm'>
                  Date: {new Date(selectedAnnotation.date).toLocaleDateString(locale)}
                </p>
              )}
            </div>
            <DialogFooter className='flex-col gap-2 sm:flex-row sm:justify-between'>
              <Button variant='destructive' onClick={handleDeleteAnnotation} className='w-full sm:w-auto'>
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </Button>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateAnnotation} disabled={!editAnnotationName.trim()}>
                  Save
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  onClick?: (annotation: ChartAnnotation) => void;
  cx?: number; // X position of the data point (from ReferenceDot)
  cy?: number; // Y position of the data point (from ReferenceDot)
}

const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  annotation,
  isHovered,
  onHover,
  onClick,
  cx = 0,
  cy = 0,
}) => {
  const pillColor = annotation.color ?? '#f59e0b';
  const pillY = 8; // Fixed Y position for the pill near top
  const pillHeight = 22;
  const pillRadius = 11;

  // Approximate text width for pill sizing
  const textWidth = annotation.label.length * 6.5 + 16;

  // Line goes from bottom of pill to the dot on the chart line
  const lineStartY = pillY + pillHeight / 2;
  const lineEndY = cy;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(annotation);
  };

  return (
    <g
      onMouseEnter={() => onHover(annotation.id)}
      onMouseLeave={() => onHover(null)}
      onClick={handleClick}
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
