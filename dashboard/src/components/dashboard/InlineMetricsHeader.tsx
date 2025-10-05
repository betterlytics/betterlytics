'use client';

import React from 'react';
import { ResponsiveContainer, Area, AreaChart } from 'recharts';
import { MousePointerClick } from 'lucide-react';
import type { SummaryCardData } from './SummaryCardsSection';
import { cn } from '@/lib/utils';
import { TrendPercentage } from '@/components/TrendPercentage';

interface ChartDatum {
  date: string;
  [key: string]: string | number;
}

type InlineMetricsHeaderProps = {
  cards: SummaryCardData[];
  pinFooter?: boolean; // when true, stick footer (e.g., CWV bar) to bottom
};

export default function InlineMetricsHeader({ cards, pinFooter }: InlineMetricsHeaderProps) {
  return (
    <div className='grid grid-cols-2 gap-1 lg:grid-cols-3 xl:grid-flow-col xl:grid-cols-none'>
      {cards.map((card, idx) => {
        return (
          <button
            key={`${card.title}-${idx}`}
            type='button'
            onClick={card.onClick}
            aria-pressed={card.isActive}
            className={`group relative flex w-auto min-w-fit flex-col overflow-hidden rounded-md border border-transparent px-2 py-4 pt-2 text-left transition-all duration-200 sm:flex-none sm:py-2 2xl:px-3 ${card.onClick ? 'cursor-pointer' : ''} ${
              !card.isActive ? 'hover:bg-accent/40 hover:border-primary/20 hover:shadow-sm' : 'shadow-sm'
            } focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none`}
            style={{ background: card.isActive ? 'var(--card-interactive)' : undefined }}
          >
            {/* Left accent rail */}
            <span
              className='absolute top-0 left-0 h-full w-[3px] rounded-r bg-transparent'
              style={{ background: card.isActive ? 'var(--chart-1)' : undefined }}
              aria-hidden='true'
            />
            {card.rawChartData && card.valueField && (
              <div
                className={cn(
                  'pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-60 transition duration-150 group-hover:opacity-90',
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
                        <stop offset='0%' stopColor={card.chartColor ?? 'var(--chart-1)'} stopOpacity={0.5} />
                        <stop offset='100%' stopColor={card.chartColor ?? 'var(--chart-1)'} stopOpacity={0.1} />
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

            <div
              className={
                pinFooter
                  ? 'relative z-10 flex h-full flex-col justify-between'
                  : 'relative z-10 flex h-full flex-col justify-between'
              }
            >
              <div className='mb-1 flex items-center justify-between'>
                <span
                  className={`text-base/tight font-medium ${
                    card.isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  {card.title}
                </span>
                {card.onClick && (
                  <MousePointerClick className='text-muted-foreground/60 absolute top-0 right-0 h-4 w-4 opacity-0 group-hover:opacity-100' />
                )}
              </div>
              <div className='flex items-center justify-between gap-2'>
                {card.icon && <div className='text-muted-foreground pt-1'>{card.icon}</div>}
                <span className='text-foreground text-2xl font-semibold tracking-tight group-hover:opacity-90'>
                  {card.value}
                </span>
                <span className='text-xs'>
                  <TrendPercentage percentage={card.comparePercentage} withIcon />
                </span>
              </div>
              {card.footer && <div className={pinFooter ? 'mt-auto pt-2' : 'mt-2'}>{card.footer}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
