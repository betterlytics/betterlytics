'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getColorForValue } from '@/utils/colorUtils';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import DataEmptyComponent from '@/components/DataEmptyComponent';
import { Spinner } from '@/components/ui/spinner';
import type { CampaignUTMBreakdownItem, UTMDimension } from '@/entities/analytics/campaign.entities';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useUTMBreakdownData } from './useUTMBreakdownData';
import { UTM_DIMENSIONS } from '@/entities/analytics/campaign.entities';
import PieChartTooltip from '@/components/charts/PieChartTooltip';

type UTMBreakdownTabbedChartProps = {
  dashboardId: string;
  campaignName: string;
  initialSource: CampaignUTMBreakdownItem[];
};

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

function UTMPieChart({ data }: { data: CampaignUTMBreakdownItem[] }) {
  const t = useTranslations('components.campaign.utm');
  const chartData = useMemo((): ChartDataItem[] => {
    if (!data || data.length === 0) return [];
    const totalVisitors = data.reduce((sum, item) => sum + item.visitors, 0);
    return data.map((item): ChartDataItem => {
      const name = item.label;
      return {
        name,
        value: item.visitors,
        color: getColorForValue(name, {
          format: 'rgb',
        }),
        percentage: totalVisitors > 0 ? (item.visitors / totalVisitors) * 100 : 0,
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return <DataEmptyComponent />;
  }

  return (
    <div className='flex flex-col items-center'>
      <ResponsiveContainer width='100%' height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx='50%'
            cy='50%'
            labelLine={false}
            innerRadius={45}
            outerRadius={80}
            fill='#8884d8'
            dataKey='value'
            nameKey='name'
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={
              <PieChartTooltip
                valueFormatter={(value) => t('columns.visitors', { count: value.toLocaleString() })}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className='mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm'>
        {chartData.map((entry) => (
          <div key={entry.name} className='flex items-center'>
            <span
              className='mr-1.5 inline-block h-3 w-3 rounded-full'
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className='text-muted-foreground'>
              {entry.name} ({formatPercentage(entry.percentage)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type UTMChartTab = UTMDimension;

export default function UTMBreakdownTabbedChart({
  dashboardId,
  campaignName,
  initialSource,
}: UTMBreakdownTabbedChartProps) {
  const t = useTranslations('components.campaign.utm');
  const { startDate, endDate } = useTimeRangeContext();
  const [activeTab, setActiveTab] = useState<UTMChartTab>('source');

  const tabs = useMemo(
    () => [
      ...UTM_DIMENSIONS.map((dimension: UTMDimension) => ({
        key: dimension,
        label: t(`tabs.${dimension}`),
      })),
    ],
    [t],
  );

  const mediumQuery = useUTMBreakdownData({
    dashboardId,
    campaignName,
    startDate,
    endDate,
    dimension: 'medium',
    enabled: activeTab === 'medium',
  });

  const contentQuery = useUTMBreakdownData({
    dashboardId,
    campaignName,
    startDate,
    endDate,
    dimension: 'content',
    enabled: activeTab === 'content',
  });

  const termQuery = useUTMBreakdownData({
    dashboardId,
    campaignName,
    startDate,
    endDate,
    dimension: 'term',
    enabled: activeTab === 'term',
  });

  return (
    <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UTMChartTab)}>
        <CardHeader className='px-0 pb-0'>
          <div className='flex flex-wrap items-center justify-between gap-2 sm:flex-row'>
            <CardTitle className='pb-2 text-sm font-medium sm:pb-0'>{t('chart.title')}</CardTitle>
            <TabsList className='bg-muted/30 dark:inset-shadow-background flex h-auto flex-wrap justify-end gap-1 px-1 inset-shadow-sm'>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className='hover:bg-accent cursor-pointer px-3 py-1 text-xs font-medium'
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className='px-0'>
          <TabsContent value='source'>
            <UTMPieChart data={initialSource} />
          </TabsContent>
          <LazyUTMChartContent
            value='medium'
            isActive={activeTab === 'medium'}
            data={mediumQuery.data ?? []}
            isPending={mediumQuery.status === 'pending'}
          />
          <LazyUTMChartContent
            value='content'
            isActive={activeTab === 'content'}
            data={contentQuery.data ?? []}
            isPending={contentQuery.status === 'pending'}
          />
          <LazyUTMChartContent
            value='term'
            isActive={activeTab === 'term'}
            data={termQuery.data ?? []}
            isPending={termQuery.status === 'pending'}
          />
        </CardContent>
      </Tabs>
    </Card>
  );
}

type LazyUTMChartContentProps = {
  value: Exclude<UTMChartTab, 'source'>;
  data: CampaignUTMBreakdownItem[];
  isActive: boolean;
  isPending: boolean;
};

function LazyUTMChartContent({ value, data, isActive, isPending }: LazyUTMChartContentProps) {
  const t = useTranslations('misc');
  const hasData = data.length > 0;

  return (
    <TabsContent value={value}>
      {isActive && isPending && !hasData ? (
        <div className='text-muted-foreground flex h-72 items-center justify-center gap-2 text-sm md:h-80'>
          <Spinner size='sm' />
          <span>{t('loading')}</span>
        </div>
      ) : (
        <UTMPieChart data={data} />
      )}
    </TabsContent>
  );
}
