'use client';

import { useMemo, useCallback, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/DataTable';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import type {
  CampaignUTMBreakdownItem,
  CampaignLandingPagePerformanceItem,
} from '@/entities/analytics/campaign.entities';
import { UTM_DIMENSIONS, type UTMDimension } from '@/entities/analytics/campaign.entities';
import { Spinner } from '@/components/ui/spinner';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useUTMBreakdownData } from './useUTMBreakdownData';

type UTMTabsKey = 'entry' | UTMDimension;

type UTMBreakdownTabbedTableProps = {
  dashboardId: string;
  campaignName: string;
  initialSource: CampaignUTMBreakdownItem[];
  landingPages: CampaignLandingPagePerformanceItem[];
};

interface BaseUTMBreakdownItem {
  visitors: number;
  bounceRate: number;
  avgSessionDuration: string;
  pagesPerSession: number;
  [key: string]: string | number;
}

export default function UTMBreakdownTabbedTable({
  dashboardId,
  campaignName,
  initialSource,
  landingPages,
}: UTMBreakdownTabbedTableProps) {
  const t = useTranslations('components.campaign.utm');
  const query = useAnalyticsQuery();
  const landingPagesBreakdown = landingPages as BaseUTMBreakdownItem[];
  const [activeTab, setActiveTab] = useState<UTMTabsKey>('entry');

  const createUTMColumns = useCallback(
    (dataKey: string, dataKeyHeader: string): ColumnDef<BaseUTMBreakdownItem>[] => {
      return [
        {
          accessorKey: dataKey,
          header: dataKeyHeader,
          cell: ({ row }) => <div className='font-medium'>{String(row.getValue(dataKey))}</div>,
        },
        {
          accessorKey: 'visitors',
          header: t('columns.visitors'),
          cell: ({ row }) => <div>{row.getValue<number>('visitors').toLocaleString()}</div>,
        },
        {
          accessorKey: 'bounceRate',
          header: t('columns.bounceRate'),
          cell: ({ row }) => <div>{formatPercentage(row.getValue<number>('bounceRate'))}</div>,
        },
        {
          accessorKey: 'avgSessionDuration',
          header: t('columns.avgSessionDuration'),
          cell: ({ row }) => <div>{row.getValue('avgSessionDuration')}</div>,
        },
        {
          accessorKey: 'pagesPerSession',
          header: t('columns.pagesPerSession'),
          cell: ({ row }) => <div>{row.getValue<number>('pagesPerSession').toFixed(1)}</div>,
        },
      ];
    },
    [t],
  );

  const sourceColumns = useMemo(() => createUTMColumns('label', t('tabs.source')), [createUTMColumns, t]);
  const mediumColumns = useMemo(() => createUTMColumns('label', t('tabs.medium')), [createUTMColumns, t]);
  const contentColumns = useMemo(() => createUTMColumns('label', t('tabs.content')), [createUTMColumns, t]);
  const termColumns = useMemo(() => createUTMColumns('label', t('tabs.term')), [createUTMColumns, t]);
  const entryPageColumns = useMemo(
    () => createUTMColumns('landingPageUrl', t('tabs.entryPages')),
    [createUTMColumns, t],
  );

  const mediumQuery = useUTMBreakdownData({
    dashboardId,
    campaignName,
    query,
    dimension: 'medium',
    enabled: activeTab === 'medium',
  });

  const contentQuery = useUTMBreakdownData({
    dashboardId,
    campaignName,
    query,
    dimension: 'content',
    enabled: activeTab === 'content',
  });

  const termQuery = useUTMBreakdownData({
    dashboardId,
    campaignName,
    query,
    dimension: 'term',
    enabled: activeTab === 'term',
  });

  return (
    <section className='flex h-full min-h-[300px] flex-col sm:min-h-[400px]'>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as UTMTabsKey)}
        className='flex h-full flex-col gap-2'
      >
        <div className='flex w-full flex-wrap items-center justify-between gap-2 sm:gap-3'>
          <p className='text-foreground text-sm font-medium'>{t('table.title')}</p>
          <TabsList className='bg-secondary dark:inset-shadow-background flex flex-wrap justify-end gap-1 px-1 inset-shadow-sm'>
            <TabsTrigger
              value='entry'
              className='hover:bg-accent text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground cursor-pointer rounded-sm border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:shadow-sm'
            >
              {t('tabs.entryPages')}
            </TabsTrigger>
            {UTM_DIMENSIONS.map((dimension) => (
              <TabsTrigger
                key={dimension}
                value={dimension}
                className='hover:bg-accent text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground cursor-pointer rounded-sm border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:shadow-sm'
              >
                {t(`tabs.${dimension}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value='entry' className='flex-1'>
          <div className='h-full overflow-x-auto'>
            <DataTable
              columns={entryPageColumns}
              data={landingPagesBreakdown}
              defaultSorting={[{ id: 'visitors', desc: true }]}
              className='h-full text-xs'
            />
          </div>
        </TabsContent>

        <TabsContent value='source' className='flex-1'>
          <div className='h-full overflow-x-auto'>
            <DataTable
              columns={sourceColumns}
              data={initialSource as BaseUTMBreakdownItem[]}
              defaultSorting={[{ id: 'visitors', desc: true }]}
              className='h-full text-xs'
            />
          </div>
        </TabsContent>

        <LazyUTMTabsContent
          value='medium'
          isActive={activeTab === 'medium'}
          columns={mediumColumns}
          queryData={mediumQuery.data as BaseUTMBreakdownItem[] | undefined}
          isPending={mediumQuery.status === 'pending'}
        />
        <LazyUTMTabsContent
          value='content'
          isActive={activeTab === 'content'}
          columns={contentColumns}
          queryData={contentQuery.data as BaseUTMBreakdownItem[] | undefined}
          isPending={contentQuery.status === 'pending'}
        />
        <LazyUTMTabsContent
          value='term'
          isActive={activeTab === 'term'}
          columns={termColumns}
          queryData={termQuery.data as BaseUTMBreakdownItem[] | undefined}
          isPending={termQuery.status === 'pending'}
        />
      </Tabs>
    </section>
  );
}

type LazyUTMTabsContentProps = {
  value: Exclude<UTMTabsKey, 'entry' | 'source'>;
  isActive: boolean;
  columns: ColumnDef<BaseUTMBreakdownItem>[];
  queryData?: BaseUTMBreakdownItem[];
  isPending: boolean;
};

function LazyUTMTabsContent({ value, isActive, columns, queryData, isPending }: LazyUTMTabsContentProps) {
  const t = useTranslations('misc');
  return (
    <TabsContent value={value} className='flex-1'>
      <div className='relative h-full'>
        <div className='h-full overflow-x-auto'>
          <DataTable
            columns={columns}
            data={queryData ?? []}
            defaultSorting={[{ id: 'visitors', desc: true }]}
            className='h-full text-xs'
          />
        </div>
        {isActive && isPending ? (
          <div className='bg-background/70 pointer-events-none absolute inset-0 flex items-center justify-center'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs'>
              <Spinner size='sm' />
              <span>{t('loading')}</span>
            </div>
          </div>
        ) : null}
      </div>
    </TabsContent>
  );
}
