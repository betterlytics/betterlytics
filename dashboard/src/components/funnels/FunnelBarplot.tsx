'use client';

import { cn } from '@/lib/utils';
import type { PresentedFunnel } from '@/presenters/toFunnel';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { ChevronDown } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatQueryFilter } from '@/utils/queryFilterFormatters';
import { useTranslations } from 'next-intl';
import { useMouse } from '@/hooks/use-mouse';

type EmptyStep = {
  name: string;
};

type FunnelChartProps = {
  funnel: PresentedFunnel;
  emptySteps?: EmptyStep[];
};

export default function FunnelBarplot({ funnel, emptySteps }: FunnelChartProps) {
  const hasEmptySteps = Boolean(emptySteps?.length);
  return (
    <div className='bg-card w-full overflow-x-auto rounded-lg border'>
      <div className='group/steps relative flex w-fit flex-col sm:flex-row'>
        {funnel.steps.map((step, i) => (
          <FunnelStep key={i} step={step} index={i} funnel={funnel} hasEmptySteps={hasEmptySteps} />
        ))}
        {emptySteps?.map((step, i) => (
          <div
            key={i}
            className='group-hover/steps:[&:not(:hover)]:bg-background/50 flex h-40 flex-row-reverse bg-gray-600/10 transition-all duration-150 sm:h-auto sm:w-50 sm:flex-col group-hover/steps:[&:not(:hover)]:opacity-50'
          >
            <div
              className={cn(
                'w-35 border-b px-2 pt-2 sm:w-full sm:border-r sm:border-b-0',
                i === emptySteps.length - 1 && 'border-b-0 sm:border-r-0',
              )}
            >
              <div>
                <p className='text-muted-foreground/75 text-xs'>Step {i + funnel.steps.length + 1}</p>
              </div>
              <h4 className='text-foreground/75 truncate text-sm font-semibold'>{step.name}</h4>
            </div>
            <div
              className={cn(
                'hidden h-40 w-full pt-2 sm:flex',
                i === funnel.steps.length - 1 &&
                  'dark:border-background/40 border-foreground/5 border-r-2 border-dashed',
              )}
            >
              <HorizontalProgress key={i} percentage={1} isFirst={false} isLast={i === emptySteps.length - 1} />
              {i < emptySteps.length - 1 && <HorizontalConnector previousPercentage={1} currentPercentage={1} />}
            </div>
            <div className='flex h-40 w-40 flex-col sm:hidden'>
              <VerticalProgress key={i} percentage={1} />
              {i < funnel.steps.length - 1 && <VerticalConnector previousPercentage={1} currentPercentage={1} />}
            </div>
            <div className='flex h-40 w-20 flex-col sm:h-20 sm:w-50 sm:flex-row'>
              <div className='flex h-20 w-20 flex-col items-center p-2 sm:h-full sm:w-25'></div>
              {i < emptySteps.length - 1 ? (
                <div className='dark:bg-background/40 bg-foreground/5 flex h-20 w-20 flex-col items-center p-2 sm:h-full sm:w-25'></div>
              ) : (
                <div className='dark:bg-background/40 bg-foreground/5 flex h-20 w-20 flex-col items-center p-2 sm:h-full sm:w-25'>
                  <p className='text-muted-foreground/75 text-xs'>Conversion</p>
                  <p className='text-md text-foreground/75 font-semibold'>{formatPercentage(0)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelStep({
  step,
  index,
  funnel,
  hasEmptySteps,
}: {
  step: PresentedFunnel['steps'][number];
  index: number;
  funnel: PresentedFunnel;
  hasEmptySteps: boolean;
}) {
  const tFilters = useTranslations('components.filters');
  const { position, ref: hoverRef } = useMouse();
  return (
    <Tooltip key={index} delayDuration={0} disableHoverableContent>
      <TooltipTrigger asChild>
        <div
          ref={hoverRef}
          className='bg-card hover:bg-foreground/2 group-hover/steps:[&:not(:hover)]:bg-background/50 group/step flex h-40 flex-row-reverse transition-all duration-150 sm:h-auto sm:w-50 sm:flex-col group-hover/steps:[&:not(:hover)]:opacity-50'
        >
          <div
            className={cn(
              'w-35 border-b px-2 pt-2 sm:w-full sm:border-r sm:border-b-0',
              index === funnel.steps.length - 1 && 'border-b-0 sm:border-r-0',
            )}
          >
            <div>
              <p className='text-muted-foreground text-xs'>Step {index + 1}</p>
            </div>
            <h4 className='text-foreground truncate text-sm font-semibold'>{step.step.name}</h4>
          </div>
          <div
            className={cn(
              'hidden h-40 w-full pt-2 sm:flex',
              index === funnel.steps.length - 1 &&
                'dark:border-background/40 border-foreground/5 border-r-2 border-dashed',
            )}
          >
            <HorizontalProgress
              percentage={100 * step.visitorsRatio}
              isFirst={index === 0}
              isLast={index === funnel.steps.length - 1 && hasEmptySteps === false}
            />
            {(index < funnel.steps.length - 1 || hasEmptySteps) && (
              <HorizontalConnector
                previousPercentage={100 * funnel.steps[index].visitorsRatio}
                currentPercentage={100 * funnel.steps[index + 1]?.visitorsRatio}
              />
            )}
          </div>
          <div className='flex h-40 w-40 flex-col sm:hidden'>
            <VerticalProgress percentage={100 * step.visitorsRatio} />
            {(index < funnel.steps.length - 1 || hasEmptySteps) && (
              <VerticalConnector
                previousPercentage={100 * funnel.steps[index].visitorsRatio}
                currentPercentage={100 * funnel.steps[index + 1]?.visitorsRatio}
              />
            )}
          </div>
          <div className='flex h-40 w-20 flex-col sm:h-20 sm:w-50 sm:flex-row'>
            <div className='flex h-20 w-20 flex-col items-center p-2 sm:h-full sm:w-25'>
              <p className='text-muted-foreground text-xs'>Visitors</p>
              <p className='text-md font-semibold'>{formatNumber(step.visitors)}</p>
              <p className='text-muted-foreground text-xs'>{formatPercentage(100 * step.visitorsRatio)}</p>
            </div>
            {index < funnel.steps.length - 1 || hasEmptySteps ? (
              <div className='dark:bg-background/40 bg-foreground/5 flex h-20 w-20 flex-col items-center p-2 sm:h-full sm:w-25'>
                <p className='text-muted-foreground text-xs'>Drop-off</p>
                <p className='text-md font-semibold'>
                  {step.dropoffCount <= 0 ? '0' : `-${formatNumber(step.dropoffCount)}`}
                </p>
                <div className='flex items-center'>
                  <ChevronDown className='text-trend-down h-2.5 w-2.5' fill='currentColor' />
                  <p className='text-trend-down text-xs'>{formatPercentage(100 * step.dropoffRatio)}</p>
                </div>
              </div>
            ) : (
              <div className='dark:bg-background/40 bg-foreground/5 flex h-20 w-20 flex-col items-center p-2 sm:h-full sm:w-25'>
                <p className='text-muted-foreground text-xs'>Conversion</p>
                <p className='text-md font-semibold'>{formatPercentage(100 * step.visitorsRatio)}</p>
              </div>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        align='start'
        alignOffset={position.x}
        sideOffset={-position.y}
        className='bg-popover translate-x-[-50%] translate-y-[-20%] border shadow-xl'
      >
        <div className='space-y-0 text-center'>
          <p className='text-popover-foreground rounded-md p-2 font-medium'>
            {formatQueryFilter(step.step, tFilters)}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function VerticalProgress({ percentage }: { percentage: number }) {
  return (
    <div className='relative flex h-20 w-full flex-col justify-end'>
      <div
        className='from-primary to-primary/50 border-foreground h-20 border-r bg-gradient-to-l'
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function VerticalConnector({
  previousPercentage,
  currentPercentage,
}: {
  previousPercentage: number;
  currentPercentage: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Watch container size
  useEffect(() => {
    if (!ref.current) return;

    const obs = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      setSize({ width: box.width, height: box.height });
    });

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const { width, height } = size;

  // Avoid drawing until we know sizes
  const prevX = ((previousPercentage || 1) / 100) * width;
  const currX = ((currentPercentage || 1) / 100) * width;

  const path = width
    ? `
      M 0 0
      L ${prevX} 0
      L ${currX} ${height}
      L 0 ${height}
      Z
    `
    : '';

  return (
    <div ref={ref} className='relative h-10 w-full flex-1'>
      {width > 0 && height > 0 && (
        <svg className='absolute inset-0' width='100%' height='100%' preserveAspectRatio='none'>
          <path d={path} fill={'color-mix(in srgb, var(--primary) 50%, transparent)'} />
        </svg>
      )}
    </div>
  );
}

function HorizontalProgress({
  percentage,
  isFirst,
  isLast,
}: {
  percentage: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className='relative flex h-full w-25 flex-col justify-end'>
      <div
        className={cn(
          'from-primary to-primary/50 group-hover:to-primary/75 w-full bg-gradient-to-b transition-colors duration-150',
          isFirst && 'rounded-tl-lg',
          isLast && 'rounded-tr-lg',
        )}
        style={{ height: `${percentage || 1}%` }}
      />
    </div>
  );
}

function HorizontalConnector({
  previousPercentage,
  currentPercentage,
}: {
  previousPercentage: number;
  currentPercentage: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Watch container size
  useEffect(() => {
    if (!ref.current) return;

    const obs = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      setSize({ width: box.width, height: box.height });
    });

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const { width, height } = size;

  // Avoid drawing until we know sizes
  const prevY = height - ((previousPercentage || 1) / 100) * height;
  const currY = height - ((currentPercentage || 1) / 100) * height;

  const path = `
    M 0 ${prevY}
    L ${width} ${currY}
    L ${width} ${height}
    L 0 ${height}
    Z
  `;

  return (
    <div ref={ref} className='relative h-full w-25'>
      {width > 0 && height > 0 && (
        <svg
          className='fill-primary/40 group-hover:fill-primary/60 absolute inset-0 transition-colors duration-150'
          width='100%'
          height='100%'
          preserveAspectRatio='none'
        >
          <path d={path} />
        </svg>
      )}
    </div>
  );
}
