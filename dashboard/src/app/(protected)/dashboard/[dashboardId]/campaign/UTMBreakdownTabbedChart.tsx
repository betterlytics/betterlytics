'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCampaignSourceColor } from '@/utils/campaignColors';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import DataEmptyComponent from '@/components/DataEmptyComponent';
import type {
  CampaignSourceBreakdownItem,
  CampaignMediumBreakdownItem,
  CampaignContentBreakdownItem,
  CampaignTermBreakdownItem,
} from '@/entities/campaign';

type UTMBreakdownTabbedChartProps = {
  source: CampaignSourceBreakdownItem[];
  medium: CampaignMediumBreakdownItem[];
  content: CampaignContentBreakdownItem[];
  term: CampaignTermBreakdownItem[];
};

type CampaignBreakdownItem =
  | CampaignSourceBreakdownItem
  | CampaignMediumBreakdownItem
  | CampaignContentBreakdownItem
  | CampaignTermBreakdownItem;

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percent: number;
}

export const CampaignDataKey = {
  SOURCE: 'source',
  MEDIUM: 'medium',
  TERM: 'term',
  CONTENT: 'content',
} as const;

function UTMPieChart({ data, dataKey }: { data: CampaignBreakdownItem[]; dataKey: string }) {
  const t = useTranslations('dashboard.emptyStates');
  const chartData = useMemo((): ChartDataItem[] => {
    if (!data || data.length === 0) return [];
    const totalVisitors = data.reduce((sum, item) => sum + item.visitors, 0);
    return data.map((item): ChartDataItem => {
      const keyValue = (item as Record<string, unknown>)[dataKey];
      const name = typeof keyValue === 'string' ? keyValue : String(keyValue);
      return {
        name,
        value: item.visitors,
        color: getCampaignSourceColor(name),
        percent: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
      };
    });
  }, [data, dataKey]);

  if (chartData.length === 0) {
    return <DataEmptyComponent />;
  }

  return (
    <div className='flex h-72 flex-col items-center md:h-80'>
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
            formatter={(value: number, name: string, props: { payload?: ChartDataItem }) => [
              `${value.toLocaleString()} visitors (${formatPercentage(props.payload?.percent ?? 0)})`,
              name,
            ]}
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
              {entry.name} ({formatPercentage(entry.percent)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UTMBreakdownTabbedChart({ source, medium, content, term }: UTMBreakdownTabbedChartProps) {
  const t = useTranslations('components.campaign.utm');
  const sourceBreakdown = source;
  const mediumBreakdown = medium;
  const contentBreakdown = content;
  const termBreakdown = term;

  const tabs = useMemo(
    () => [
      {
        key: 'source',
        label: t('tabs.source'),
        data: sourceBreakdown,
        dataKey: CampaignDataKey.SOURCE,
      },
      {
        key: 'medium',
        label: t('tabs.medium'),
        data: mediumBreakdown,
        dataKey: CampaignDataKey.MEDIUM,
      },
      {
        key: 'content',
        label: t('tabs.content'),
        data: contentBreakdown,
        dataKey: CampaignDataKey.CONTENT,
      },
      {
        key: 'term',
        label: t('tabs.terms'),
        data: termBreakdown,
        dataKey: CampaignDataKey.TERM,
      },
    ],
    [sourceBreakdown, mediumBreakdown, contentBreakdown, termBreakdown, t],
  );

  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <Tabs defaultValue='source'>
        <CardHeader className='px-0 pb-0'>
          <div className='flex flex-col items-center justify-between sm:flex-row'>
            <CardTitle className='text-base font-medium'>{t('chart.title')}</CardTitle>
            <TabsList
              className={`bg-muted/30 grid h-8 w-auto grid-cols-${tabs.length} dark:inset-shadow-background gap-1 inset-shadow-sm`}
            >
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
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <UTMPieChart data={tab.data} dataKey={tab.dataKey} />
            </TabsContent>
          ))}
        </CardContent>
      </Tabs>
    </Card>
  );
}
