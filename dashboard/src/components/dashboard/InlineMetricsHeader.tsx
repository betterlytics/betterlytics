'use client';

import React from 'react';
import { ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ChevronUp, ChevronDown, MousePointer2 } from 'lucide-react';
import type { SummaryCardData } from './SummaryCardsSection';
import { cn } from '@/lib/utils';

interface ChartDatum {
  date: string;
  [key: string]: string | number;
}

function calculateTrend<T extends ChartDatum>(data: T[], valueField: keyof T) {
  if (!data || data.length < 2) return null;
  const first = Number(data[0][valueField]);
  const last = Number(data[data.length - 1][valueField]);
  if (first === 0) return null;
  const diffPct = ((last - first) / first) * 100;
  const absPct = Math.abs(diffPct);
  return {
    direction: diffPct > 0 ? 'up' : diffPct < 0 ? 'down' : 'neutral',
    percentage: absPct,
    isPositive: diffPct >= 0,
  } as const;
}

type InlineMetricsHeaderProps = {
  cards: SummaryCardData[];
  widthClass?: string; // optional override for card width at breakpoints
  pinFooter?: boolean; // when true, stick footer (e.g., CWV bar) to bottom
};

export default function InlineMetricsHeader({ cards, widthClass, pinFooter }: InlineMetricsHeaderProps) {
  const widthClasses = widthClass || 'sm:w-[228px] md:w-[228px]';
  return (
    <div className='grid w-full grid-cols-2 gap-2 px-1 sm:flex sm:flex-wrap sm:gap-3'>
      {cards.map((card, idx) => {
        const trend =
          card.rawChartData && card.valueField
            ? calculateTrend(card.rawChartData as ChartDatum[], card.valueField as keyof ChartDatum)
            : null;

        return (
          <button
            key={`${card.title}-${idx}`}
            type='button'
            onClick={card.onClick}
            aria-pressed={card.isActive}
            className={`group relative flex w-full min-w-0 flex-col overflow-hidden rounded-md px-3 py-4 text-left transition-all duration-200 sm:flex-none sm:py-2 ${
              widthClasses
            } ${
              card.onClick ? 'cursor-pointer' : ''
            } ${!card.isActive ? 'hover:brightness-85 hover:saturate-90' : ''}`}
            style={{ background: card.isActive ? 'var(--secondary)' : undefined }}
          >
            {/* Left accent rail */}
            <span
              className='absolute top-0 left-0 h-full w-[3px] rounded-r'
              style={{ background: card.isActive ? 'var(--chart-1)' : 'transparent' }}
              aria-hidden='true'
            />
            {card.rawChartData && card.valueField && (
              <div
                className={cn(
                  'pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-50 transition duration-150 group-hover:opacity-90',
                  { 'opacity-100': card.isActive },
                )}
              >
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart
                    data={card.rawChartData as ChartDatum[]}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id={`inline-gradient-${idx}`} x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor={card.chartColor ?? 'var(--chart-1)'} stopOpacity={0.3} />
                        <stop offset='100%' stopColor={card.chartColor ?? 'var(--chart-1)'} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area
                      type='monotone'
                      dataKey={card.valueField as string}
                      stroke={card.chartColor ?? 'var(--chart-1)'}
                      strokeWidth={1}
                      fill={`url(#inline-gradient-${idx})`}
                      dot={false}
                      activeDot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className={pinFooter ? 'relative z-10 flex h-full flex-col' : 'relative z-10'}>
              <div className='mb-1 flex items-center justify-between'>
                <span
                  className={`text- font-medium sm:text-base ${
                    card.isActive ? 'text-foreground' : 'text-muted-foreground group-hover:opacity-90'
                  }`}
                >
                  {card.title}
                </span>
                {card.onClick && (
                  <MousePointer2 className='text-muted-foreground/60 h-4 w-4 opacity-0 group-hover:opacity-100' />
                )}
              </div>
              <div className='flex items-center gap-2'>
                {card.icon && <div className='text-muted-foreground pt-1'>{card.icon}</div>}
                <span className='text-foreground text-base font-semibold tracking-tight group-hover:opacity-90 sm:text-xl md:text-2xl'>
                  {card.value}
                </span>
                {trend && trend.direction !== 'neutral' && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${
                      trend.isPositive ? 'text-trend-up' : 'text-trend-down'
                    } group-hover:opacity-90`}
                  >
                    {trend.direction === 'up' ? (
                      <ChevronUp className='h-3.5 w-3.5' fill='currentColor' />
                    ) : (
                      <ChevronDown className='h-3.5 w-3.5' fill='currentColor' />
                    )}
                    {trend.percentage.toFixed(1)}%
                  </span>
                )}
              </div>
              {card.footer && <div className={pinFooter ? 'mt-auto pt-2' : 'mt-2'}>{card.footer}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
