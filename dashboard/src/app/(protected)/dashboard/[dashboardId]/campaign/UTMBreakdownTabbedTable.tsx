'use client';

import { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/DataTable';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import type {
  CampaignSourceBreakdownItem,
  CampaignMediumBreakdownItem,
  CampaignContentBreakdownItem,
  CampaignTermBreakdownItem,
} from '@/entities/campaign';
import type { CampaignExpandedDetails } from '@/app/actions/campaigns';

type UTMBreakdownTabbedTableProps = {
  source: CampaignSourceBreakdownItem[];
  medium: CampaignMediumBreakdownItem[];
  content: CampaignContentBreakdownItem[];
  term: CampaignTermBreakdownItem[];
  landingPages: CampaignExpandedDetails['landingPages'];
};

interface BaseUTMBreakdownItem {
  visitors: number;
  bounceRate: number;
  avgSessionDuration: string;
  pagesPerSession: number;
  [key: string]: string | number;
}

export default function UTMBreakdownTabbedTable({
  source,
  medium,
  content,
  term,
  landingPages,
}: UTMBreakdownTabbedTableProps) {
  const t = useTranslations('components.campaign.utm');
  const sourceBreakdown = source;
  const mediumBreakdown = medium;
  const contentBreakdown = content;
  const termBreakdown = term;
  const landingPagesBreakdown = landingPages as BaseUTMBreakdownItem[];

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

  const tabs = useMemo(
    () => [
      {
        key: 'entry',
        label: 'Entry pages',
        data: landingPagesBreakdown,
        columns: entryPageColumns,
      },
      {
        key: 'source',
        label: t('tabs.source'),
        data: sourceBreakdown as BaseUTMBreakdownItem[],
        columns: sourceColumns,
      },
      {
        key: 'medium',
        label: t('tabs.medium'),
        data: mediumBreakdown as BaseUTMBreakdownItem[],
        columns: mediumColumns,
      },
      {
        key: 'content',
        label: t('tabs.content'),
        data: contentBreakdown as BaseUTMBreakdownItem[],
        columns: contentColumns,
      },
      {
        key: 'term',
        label: t('tabs.terms'),
        data: termBreakdown as BaseUTMBreakdownItem[],
        columns: termColumns,
      },
    ],
    [
      landingPagesBreakdown,
      sourceBreakdown,
      mediumBreakdown,
      contentBreakdown,
      termBreakdown,
      entryPageColumns,
      sourceColumns,
      mediumColumns,
      contentColumns,
      termColumns,
      t,
    ],
  );

  return (
    <section className='flex h-full min-h-[300px] flex-col sm:min-h-[400px]'>
      <Tabs defaultValue='entry' className='flex h-full flex-col gap-2'>
        <div className='flex w-full items-center justify-between gap-3'>
          <p className='text-foreground text-sm font-medium'>{t('table.title')}</p>
          <TabsList className='bg-secondary dark:inset-shadow-background inline-flex gap-1 px-1 inset-shadow-sm'>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className='hover:bg-accent text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground cursor-pointer rounded-sm border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:shadow-sm'
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className='flex-1'>
            <div className='h-full overflow-x-auto'>
              <DataTable
                columns={tab.columns}
                data={tab.data}
                defaultSorting={[{ id: 'visitors', desc: true }]}
                className='h-full text-xs'
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
