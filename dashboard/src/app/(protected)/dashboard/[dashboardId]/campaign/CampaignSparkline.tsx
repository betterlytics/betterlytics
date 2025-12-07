'use client';

import { memo, useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { CampaignSparklinePoint } from '@/entities/campaign';
import { useTranslations } from 'next-intl';

export type CampaignSparklineProps = {
  data?: CampaignSparklinePoint[];
};

const CampaignSparkline = memo(({ data }: CampaignSparklineProps) => {
  const t = useTranslations('components.campaign.campaignRow');
  const gradientId = useId();
  const hasData = data && data.length > 0;

  if (!hasData) {
    return <div className='bg-muted/40 h-full w-full rounded-md' aria-hidden='true' />;
  }

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`campaign-sparkline-${gradientId}`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='var(--chart-1)' stopOpacity={0.9} />
              <stop offset='100%' stopColor='var(--chart-1)' stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <RechartsTooltip
            cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.85, strokeWidth: 1.5 }}
            content={(props: TooltipProps<number, string>) => {
              const { active, payload } = props;
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0].payload as CampaignSparklinePoint;
              const date = new Date(point.date);
              return (
                <div className='bg-popover text-popover-foreground border-border rounded-md border px-3 py-1.5 text-[11px] shadow-lg'>
                  <div className='text-muted-foreground mb-0.5'>
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className='text-foreground text-xs font-semibold'>
                    {t('sessions', { count: point.visitors })}
                  </div>
                </div>
              );
            }}
          />
          <Area
            type='linear'
            dataKey='visitors'
            stroke='var(--chart-1)'
            strokeWidth={2.5}
            fill={`url(#campaign-sparkline-${gradientId})`}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

CampaignSparkline.displayName = 'CampaignSparkline';

export default CampaignSparkline;
