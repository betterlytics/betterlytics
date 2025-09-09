'use client';

import { use, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import TabbedTable, { TabDefinition } from '@/components/TabbedTable';
import { formatPercentage } from '@/utils/formatters';
import {
  fetchCampaignSourceBreakdownAction,
  fetchCampaignMediumBreakdownAction,
  fetchCampaignContentBreakdownAction,
  fetchCampaignTermBreakdownAction,
} from '@/app/actions';
import { useTranslations } from 'next-intl';

type UTMBreakdownTabbedTableProps = {
  sourceBreakdownPromise: ReturnType<typeof fetchCampaignSourceBreakdownAction>;
  mediumBreakdownPromise: ReturnType<typeof fetchCampaignMediumBreakdownAction>;
  contentBreakdownPromise: ReturnType<typeof fetchCampaignContentBreakdownAction>;
  termBreakdownPromise: ReturnType<typeof fetchCampaignTermBreakdownAction>;
};

interface BaseUTMBreakdownItem {
  visitors: number;
  bounceRate: number;
  avgSessionDuration: string;
  pagesPerSession: number;
  [key: string]: string | number;
}

export default function UTMBreakdownTabbedTable({
  sourceBreakdownPromise,
  mediumBreakdownPromise,
  contentBreakdownPromise,
  termBreakdownPromise,
}: UTMBreakdownTabbedTableProps) {
  const t = useTranslations('components.campaign.utm');
  const sourceBreakdown = use(sourceBreakdownPromise);
  const mediumBreakdown = use(mediumBreakdownPromise);
  const contentBreakdown = use(contentBreakdownPromise);
  const termBreakdown = use(termBreakdownPromise);

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

  const tabs: TabDefinition<BaseUTMBreakdownItem>[] = useMemo(
    () => [
      {
        key: 'source',
        label: t('tabs.source'),
        data: sourceBreakdown as BaseUTMBreakdownItem[],
        columns: sourceColumns,
        defaultSorting: [{ id: 'visitors', desc: true }],
        emptyMessage: t('empty.source'),
      },
      {
        key: 'medium',
        label: t('tabs.medium'),
        data: mediumBreakdown as BaseUTMBreakdownItem[],
        columns: mediumColumns,
        defaultSorting: [{ id: 'visitors', desc: true }],
        emptyMessage: t('empty.medium'),
      },
      {
        key: 'content',
        label: t('tabs.content'),
        data: contentBreakdown as BaseUTMBreakdownItem[],
        columns: contentColumns,
        defaultSorting: [{ id: 'visitors', desc: true }],
        emptyMessage: t('empty.content'),
      },
      {
        key: 'term',
        label: t('tabs.terms'),
        data: termBreakdown as BaseUTMBreakdownItem[],
        columns: termColumns,
        defaultSorting: [{ id: 'visitors', desc: true }],
        emptyMessage: t('empty.term'),
      },
    ],
    [
      sourceBreakdown,
      mediumBreakdown,
      contentBreakdown,
      termBreakdown,
      sourceColumns,
      mediumColumns,
      contentColumns,
      termColumns,
      t,
    ],
  );

  return <TabbedTable title={t('table.title')} tabs={tabs} defaultTab='source' />;
}
