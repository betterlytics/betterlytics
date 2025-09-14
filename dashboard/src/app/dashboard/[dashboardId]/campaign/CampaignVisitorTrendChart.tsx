'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCampaignSourceColor } from '@/utils/campaignColors';
import { StackedAreaChartTooltip } from '@/components/charts/StackedAreaChartTooltip';
import { type ComparisonMapping } from '@/types/charts';
import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { formatNumber } from '@/utils/formatters';

interface CampaignVisitorTrendChartProps {
  chartData: Array<{ date: number } & Record<string, number>>;
  categories: string[];
  comparisonMap?: ComparisonMapping[];
  granularity?: GranularityRangeValues;
}

export default function CampaignVisitorTrendChart({
  chartData,
  categories,
  comparisonMap,
  granularity,
}: CampaignVisitorTrendChartProps) {
  const t = useTranslations('components.campaign.trend');
  const tEmpty = useTranslations('dashboard.emptyStates');
  if (!chartData || chartData.length === 0 || categories.length === 0) {
    return (
      <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[350px] sm:px-6 sm:pt-4 sm:pb-4'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className='px-0'>
          <div className='flex h-[300px] items-center justify-center'>
            <div className='text-center'>
              <p className='text-muted-foreground mb-1'>{tEmpty('noData')}</p>
              <p className='text-muted-foreground/70 text-xs'>{tEmpty('adjustTimeRange')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-base font-medium'>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        <div style={{ width: '100%', height: 300 }} className='mt-10'>
          <ResponsiveContainer className='mt-4'>
            <AreaChart data={chartData} margin={{ top: 10, right: 22, left: 22, bottom: 0 }}>
              <CartesianGrid className='opacity-10' vertical={false} strokeWidth={1.5} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                className='text-muted-foreground'
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickMargin={6}
                minTickGap={100}
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className='text-muted-foreground'
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickFormatter={(value) => formatNumber(value)}
                width={40}
              />
              <Tooltip
                content={(props) => (
                  <StackedAreaChartTooltip
                    active={props.active}
                    payload={props.payload}
                    label={props.label}
                    comparisonMap={comparisonMap}
                    granularity={granularity}
                    formatter={(value: number) => `${formatNumber(value)} visitors`}
                  />
                )}
              />
              {categories.map((campaignName) => (
                <Area
                  key={campaignName}
                  type='monotone'
                  dataKey={campaignName}
                  stackId='1'
                  stroke={getCampaignSourceColor(campaignName)}
                  fill={getCampaignSourceColor(campaignName)}
                  fillOpacity={0.7}
                  name={campaignName}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className='mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm'>
          {categories.map((campaignName) => (
            <div key={campaignName} className='flex items-center'>
              <span
                className='mr-1.5 inline-block h-3 w-3 rounded-full'
                style={{ backgroundColor: getCampaignSourceColor(campaignName) }}
              ></span>
              <span className='text-muted-foreground'>{campaignName}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
