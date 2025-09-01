'use client';

import { use, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCampaignSourceColor } from '@/utils/campaignColors';
import { formatPercentage } from '@/utils/formatters';
import {
  fetchCampaignSourceBreakdownAction,
  fetchCampaignMediumBreakdownAction,
  fetchCampaignContentBreakdownAction,
  fetchCampaignTermBreakdownAction,
} from '@/app/actions';
import { useTranslations } from 'next-intl';

type UTMBreakdownTabbedChartProps = {
  sourceBreakdownPromise: ReturnType<typeof fetchCampaignSourceBreakdownAction>;
  mediumBreakdownPromise: ReturnType<typeof fetchCampaignMediumBreakdownAction>;
  contentBreakdownPromise: ReturnType<typeof fetchCampaignContentBreakdownAction>;
  termBreakdownPromise: ReturnType<typeof fetchCampaignTermBreakdownAction>;
};

interface CampaignBreakdownItem {
  visitors: number;
  [key: string]: unknown; // source, medium, term, content
}

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

function UTMPieChart({
  data,
  dataKey,
  emptyMessage,
}: {
  data: CampaignBreakdownItem[];
  dataKey: string;
  emptyMessage: string;
}) {
  const chartData = useMemo((): ChartDataItem[] => {
    if (!data || data.length === 0) return [];
    const totalVisitors = data.reduce((sum, item) => sum + item.visitors, 0);
    return data.map((item): ChartDataItem => {
      const keyValue = item[dataKey];
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
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <p className='text-muted-foreground text-sm'>{emptyMessage}</p>
      </div>
    );
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

export default function UTMBreakdownTabbedChart({
  sourceBreakdownPromise,
  mediumBreakdownPromise,
  contentBreakdownPromise,
  termBreakdownPromise,
}: UTMBreakdownTabbedChartProps) {
  const t = useTranslations('components.campaign.utm');
  const sourceBreakdown = use(sourceBreakdownPromise);
  const mediumBreakdown = use(mediumBreakdownPromise);
  const contentBreakdown = use(contentBreakdownPromise);
  const termBreakdown = use(termBreakdownPromise);

  const tabs = useMemo(
    () => [
      {
        key: 'source',
        label: t('tabs.source'),
        data: sourceBreakdown,
        dataKey: CampaignDataKey.SOURCE,
        emptyMessage: t('empty.source'),
      },
      {
        key: 'medium',
        label: t('tabs.medium'),
        data: mediumBreakdown,
        dataKey: CampaignDataKey.MEDIUM,
        emptyMessage: t('empty.medium'),
      },
      {
        key: 'content',
        label: t('tabs.content'),
        data: contentBreakdown,
        dataKey: CampaignDataKey.CONTENT,
        emptyMessage: t('empty.content'),
      },
      {
        key: 'term',
        label: t('tabs.terms'),
        data: termBreakdown,
        dataKey: CampaignDataKey.TERM,
        emptyMessage: t('empty.term'),
      },
    ],
    [sourceBreakdown, mediumBreakdown, contentBreakdown, termBreakdown, t],
  );

  return (
    <Card className='bg-card border-border rounded-lg border shadow'>
      <Tabs defaultValue='source'>
        <CardHeader className='pb-0'>
          <div className='flex flex-col items-center justify-between sm:flex-row'>
            <div>
              <CardTitle className='mb-1 text-lg font-semibold'>{t('chart.title')}</CardTitle>
              <p className='text-muted-foreground text-sm'>{t('chart.description')}</p>
            </div>
            <TabsList className={`bg-muted/30 grid h-8 w-auto grid-cols-${tabs.length}`}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className='px-3 py-1 text-xs font-medium'>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className='px-6 pt-0 pb-4'>
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <UTMPieChart data={tab.data} dataKey={tab.dataKey} emptyMessage={tab.emptyMessage} />
            </TabsContent>
          ))}
        </CardContent>
      </Tabs>
    </Card>
  );
}
