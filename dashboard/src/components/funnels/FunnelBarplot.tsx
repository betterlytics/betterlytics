'use client';

import { QueryFilter } from '@/entities/filter';
import type { PresentedFunnel } from '@/presenters/toFunnel';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { formatQueryFilter } from '@/utils/queryFilterFormatters';
import { useTranslations } from 'next-intl';

import React, { useEffect, useRef, useState } from 'react';

type FunnelChartProps = {
  funnel: PresentedFunnel;
};

export default function FunnelBarplot({ funnel: _ }: FunnelChartProps) {
  const funnel = {
    id: 'cmi694qvj000auzi0aa20bb3x',
    stepCount: 2,
    visitorCount: {
      min: 2,
      max: 2,
    },
    steps: [
      {
        queryFilter: {
          id: 'mi67mthirq4bh1ztxr8',
          column: 'url',
          operator: '=',
          value: '/dashboard/*',
        },
        visitors: 28604,
        visitorsRatio: 1,
        dropoffCount: 11162,
        dropoffRatio: 0.392,
        stepFilters: [
          {
            id: 'mi67mthirq4bh1ztxr8',
            column: 'url',
            operator: '=',
            value: '/dashboard/*',
          },
          {
            id: 'mi67mthkwd4z0jy94bd',
            column: 'url',
            operator: '=',
            value: '/dashboard/*/funnels',
          },
        ],
      },
      {
        queryFilter: {
          id: 'mi67mthkwd4z0jy94bd',
          column: 'url',
          operator: '=',
          value: '/dashboard/*/funnels',
        },
        visitors: 17162,
        visitorsRatio: 0.66,
        dropoffCount: 1955,
        dropoffRatio: 0.118,
        stepFilters: [
          {
            id: 'mi67mthkwd4z0jy94bd',
            column: 'url',
            operator: '=',
            value: '/dashboard/*/funnels',
          },
          {
            id: 'mi67mthkwd4z0jy94bd',
            column: 'url',
            operator: '=',
            value: '/dashboard/*/funnels',
          },
        ],
      },
      {
        queryFilter: {
          id: 'mi67mthkwd4z0jy94bd',
          column: 'url',
          operator: '=',
          value: '/dashboard/*/test',
        },
        visitors: 15307,
        visitorsRatio: 0.561,
        dropoffCount: 7634,
        dropoffRatio: 0.435,
        stepFilters: [
          {
            id: 'mi67mthkwd4z0jy94bd',
            column: 'url',
            operator: '=',
            value: '/dashboard/*/funnels',
          },
          {
            id: 'mi67mthkwd4z0jy94bd',
            column: 'url',
            operator: '=',
            value: '/dashboard/*/funnels',
          },
        ],
      },
      {
        queryFilter: {
          id: 'mi67mthkwd4z0jy94bd',
          column: 'url',
          operator: '=',
          value: '/dashboard/*/test',
        },
        visitors: 4543,
        visitorsRatio: 0.163,
        dropoffCount: 2268,
        dropoffRatio: 0.341,
        stepFilters: [
          {
            id: 'mi67mthkwd4z0jy94bd',
            column: 'url',
            operator: '=',
            value: '/dashboard/*/funnels',
          },
          {
            id: 'mi67mthkwd4z0jy94bd',
            column: 'url',
            operator: '=',
            value: '/dashboard/*/funnels',
          },
        ],
      },
    ],
    biggestDropOff: {
      queryFilter: {
        id: 'mi67mthirq4bh1ztxr8',
        column: 'url',
        operator: '=',
        value: '/dashboard/*',
      },
      visitors: 2,
      visitorsRatio: 1,
      dropoffCount: 0,
      dropoffRatio: 0,
      stepFilters: [
        {
          id: 'mi67mthirq4bh1ztxr8',
          column: 'url',
          operator: '=',
          value: '/dashboard/*',
        },
        {
          id: 'mi67mthkwd4z0jy94bd',
          column: 'url',
          operator: '=',
          value: '/dashboard/*/funnels',
        },
      ],
    },
    conversionRate: 1,
    name: 'My new funnel',
  };

  const tFilters = useTranslations('components.filters');

  return (
    <div className='bg-card gap-10 space-y-2 rounded-xl border p-2'>
      <div className='px-2'>
        <h2 className='text-foreground text-base font-semibold'>{funnel.name}</h2>
      </div>

      <div className='relative flex w-fit border-r'>
        {funnel.steps.map((step, i) => (
          <div key={i} className='flex w-50 flex-col'>
            <div className='w-full border border-r-0 p-2'>
              <h4 className='text-foreground truncate text-sm font-medium'>
                {formatQueryFilter(step.queryFilter as QueryFilter, tFilters)}
              </h4>
              <div className='flex items-center justify-between'>
                <p className='text-xl font-semibold'>{formatNumber(step.visitors)}</p>
                <p className='text-muted-foreground text-sm'>{formatPercentage(100 * step.visitorsRatio)}</p>
              </div>
            </div>
            <div className='flex h-40 w-full border-l pt-2'>
              <HorizontalProgress key={i} percentage={100 * step.visitorsRatio} />
              {i < funnel.steps.length - 1 && (
                <HorizontalConnector
                  previousPercentage={100 * funnel.steps[i].visitorsRatio}
                  currentPercentage={100 * funnel.steps[i + 1].visitorsRatio}
                />
              )}
            </div>
            <div className='w-full border border-r-0 p-2'>
              <p className='text-muted-foreground text-sm'>Abandonment</p>
              <div className='flex items-center justify-between'>
                <p>{formatNumber(step.dropoffCount)}</p>
                <p className='text-trend-down text-sm'>{formatPercentage(100 * step.dropoffRatio)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepInfo({
  step,
  tFilters,
}: {
  step: PresentedFunnel['steps'][number];
  tFilters: ReturnType<typeof useTranslations<'components.filters'>>;
}) {
  return (
    <div className='h-20 w-60'>{/* <p>{formatQueryFilter(step.queryFilter as QueryFilter, tFilters)}</p> */}</div>
  );
}

function VerticalProgress({ percentage }: { percentage: number }) {
  return (
    <div className='relative flex h-10 w-full flex-col justify-end'>
      <div className='bg-primary h-10' style={{ width: `${percentage}%` }} />
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
  const prevX = (previousPercentage / 100) * width;
  const currX = (currentPercentage / 100) * width;

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

function HorizontalProgress({ percentage }: { percentage: number }) {
  return (
    <div className='relative flex h-full w-20 flex-col justify-end'>
      <div className='bg-primary w-20' style={{ height: `${percentage}%` }} />
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
  const prevY = height - (previousPercentage / 100) * height;
  const currY = height - (currentPercentage / 100) * height;

  const path = `
    M 0 ${prevY}
    L ${width} ${currY}
    L ${width} ${height}
    L 0 ${height}
    Z
  `;

  return (
    <div ref={ref} className='relative h-full w-full flex-1'>
      {width > 0 && height > 0 && (
        <svg className='absolute inset-0' width='100%' height='100%' preserveAspectRatio='none'>
          <path d={path} fill={'color-mix(in srgb, var(--primary) 50%, transparent)'} />
        </svg>
      )}
    </div>
  );
}
