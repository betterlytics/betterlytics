'use client';

import { use, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import DataEmptyComponent from '@/components/DataEmptyComponent';
import { fetchErrorVolumeAction } from '@/app/actions/analytics/errors.actions';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { defaultDateLabelFormatter, granularityDateFormatter } from '@/utils/chartUtils';
import { formatNumber } from '@/utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocale } from 'next-intl';

const AXIS = {
  fontSize: 12,
  tickMargin: 6,
  minTickGap: 100,
} as const;

type ErrorsOverviewChartProps = {
  chartPromise: ReturnType<typeof fetchErrorVolumeAction>;
};

export function ErrorsOverviewChart({ chartPromise }: ErrorsOverviewChartProps) {
  const data = use(chartPromise);
  const { granularity } = useTimeRangeContext();
  const isMobile = useIsMobile();
  const locale = useLocale();

  const axisFormatter = useMemo(
    () => granularityDateFormatter(granularity, locale),
    [granularity, locale],
  );

  const renderTooltip = useCallback(
    (props: any) => {
      const { active, payload, label } = props;
      if (!active || !payload?.length) return null;

      const dateLabel = defaultDateLabelFormatter(label, granularity, locale);
      const count = payload[0].value as number;

      return (
        <div className='border-border bg-popover/95 min-w-[160px] rounded-lg border p-3 shadow-xl backdrop-blur-sm'>
          <div className='text-popover-foreground mb-1 text-sm font-medium'>Errors</div>
          <div className='text-muted-foreground text-sm'>{dateLabel}</div>
          <div className='text-popover-foreground mt-1 text-sm font-medium'>
            {formatNumber(count)}
          </div>
        </div>
      );
    },
    [granularity, locale],
  );

  if (!data || data.length === 0) {
    return <DataEmptyComponent />;
  }

  return (
    <Card className='px-3 pt-2 pb-4 sm:px-2 sm:pt-4 sm:pb-5'>
      <CardContent className='p-0'>
        <div className='mb-5 p-0 sm:px-4'>
          <h3 className='text-base font-medium'>Error volume</h3>
        </div>
        <div className='h-80 py-1 sm:px-2 md:px-4'>
          <ResponsiveContainer width='100%' height='100%' className='mt-4'>
            <BarChart
              data={data}
              margin={{ top: 10, left: isMobile ? 0 : 6, bottom: 0, right: 1 }}
            >
              <CartesianGrid className='opacity-10' vertical={false} strokeWidth={1.5} />
              <XAxis
                dataKey='date'
                fontSize={AXIS.fontSize}
                tickLine={false}
                axisLine={false}
                className='text-muted-foreground'
                tick={{ fontSize: AXIS.fontSize, fill: 'var(--muted-foreground)' }}
                tickFormatter={(value) =>
                  axisFormatter(new Date(typeof value === 'number' ? value : String(value)))
                }
                minTickGap={AXIS.minTickGap}
                tickMargin={AXIS.tickMargin}
                allowDuplicatedCategory={false}
              />
              <YAxis
                fontSize={AXIS.fontSize}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: AXIS.fontSize, fill: 'var(--muted-foreground)' }}
                tickFormatter={formatNumber}
                className='text-muted-foreground'
                width={40}
                mirror={isMobile}
                allowDecimals={false}
              />
              <Tooltip content={renderTooltip} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
              <Bar
                dataKey='count'
                fill='var(--chart-error)'
                opacity={0.85}
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
