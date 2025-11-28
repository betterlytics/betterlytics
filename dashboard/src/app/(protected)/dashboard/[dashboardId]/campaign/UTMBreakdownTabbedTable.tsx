'use client';

import { useMemo, useCallback, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/DataTable';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import type { CampaignSourceBreakdownItem, CampaignLandingPagePerformanceItem } from '@/entities/campaign';
import { Spinner } from '@/components/ui/spinner';
import { useUTMBreakdownData } from './useUTMBreakdownData';

type UTMTabsKey = 'entry' | 'source' | 'medium' | 'content' | 'term';

type UTMBreakdownTabbedTableProps = {
  dashboardId: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  initialSource: CampaignSourceBreakdownItem[];
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
  startDate,
  endDate,
  initialSource,
  landingPages,
}: UTMBreakdownTabbedTableProps) {
  const t = useTranslations('components.campaign.utm');
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

  const sourceColumns = useMemo(() => createUTMColumns('source', t('tabs.source')), [createUTMColumns, t]);
  const mediumColumns = useMemo(() => createUTMColumns('medium', t('tabs.medium')), [createUTMColumns, t]);
  const contentColumns = useMemo(() => createUTMColumns('content', t('tabs.content')), [createUTMColumns, t]);
  const termColumns = useMemo(() => createUTMColumns('term', t('tabs.terms')), [createUTMColumns, t]);
  const entryPageColumns = useMemo(() => createUTMColumns('landingPageUrl', 'Entry page'), [createUTMColumns]);

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
    <section className='flex h-full min-h-[300px] flex-col sm:min-h-[400px]'>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as UTMTabsKey)}
        className='flex h-full flex-col gap-2'
      >
        <div className='flex w-full items-center justify-between gap-3'>
          <p className='text-foreground text-sm font-medium'>{t('table.title')}</p>
          <TabsList className='bg-secondary dark:inset-shadow-background inline-flex gap-1 px-1 inset-shadow-sm'>
            <TabsTrigger
              value='entry'
              className='hover:bg-accent text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground cursor-pointer rounded-sm border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:shadow-sm'
            >
              Entry pages
            </TabsTrigger>
            {(['source', 'medium', 'content', 'term'] as Array<Exclude<UTMTabsKey, 'entry'>>).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className='hover:bg-accent text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground cursor-pointer rounded-sm border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:shadow-sm'
              >
                {t(`tabs.${key === 'term' ? 'terms' : key}`)}
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
  const hasData = (queryData?.length ?? 0) > 0;

  return (
    <TabsContent value={value} className='flex-1'>
      {isActive && isPending && !hasData ? (
        <div className='text-muted-foreground flex h-full min-h-[160px] items-center justify-center gap-2 text-xs'>
          <Spinner size='sm' />
          <span>Loading...</span>
        </div>
      ) : (
        <div className='h-full overflow-x-auto'>
          <DataTable
            columns={columns}
            data={queryData ?? []}
            defaultSorting={[{ id: 'visitors', desc: true }]}
            className='h-full text-xs'
          />
        </div>
      )}
    </TabsContent>
  );
}
