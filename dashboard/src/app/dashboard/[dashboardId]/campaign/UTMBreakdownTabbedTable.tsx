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
  const tTabs = useTranslations('components.campaign.utm.tabs');
  const tEmpty = useTranslations('components.campaign.utm.empty');
  const tCols = useTranslations('components.campaign.utm.columns');
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
          header: tCols('visitors'),
          cell: ({ row }) => <div>{row.getValue<number>('visitors').toLocaleString()}</div>,
        },
        {
          accessorKey: 'bounceRate',
          header: tCols('bounceRate'),
          cell: ({ row }) => <div>{formatPercentage(row.getValue<number>('bounceRate'))}</div>,
        },
        {
          accessorKey: 'avgSessionDuration',
          header: tCols('avgSessionDuration'),
          cell: ({ row }) => <div>{row.getValue('avgSessionDuration')}</div>,
        },
        {
          accessorKey: 'pagesPerSession',
          header: tCols('pagesPerSession'),
          cell: ({ row }) => <div>{row.getValue<number>('pagesPerSession').toFixed(1)}</div>,
        },
      ];
    },
    [tCols],
  );

  const sourceColumns = useMemo(() => createUTMColumns('source', tTabs('source')), [createUTMColumns, tTabs]);
  const mediumColumns = useMemo(() => createUTMColumns('medium', tTabs('medium')), [createUTMColumns, tTabs]);
  const contentColumns = useMemo(() => createUTMColumns('content', tTabs('content')), [createUTMColumns, tTabs]);
  const termColumns = useMemo(() => createUTMColumns('term', tTabs('terms')), [createUTMColumns, tTabs]);

  const tabs: TabDefinition<BaseUTMBreakdownItem>[] = useMemo(
    () => [
      {
        key: 'source',
        label: tTabs('source'),
        data: sourceBreakdown as BaseUTMBreakdownItem[],
        columns: sourceColumns,
        defaultSorting: [{ id: 'visitors', desc: true }],
        emptyMessage: tEmpty('source'),
      },
      {
        key: 'medium',
        label: tTabs('medium'),
        data: mediumBreakdown as BaseUTMBreakdownItem[],
        columns: mediumColumns,
        defaultSorting: [{ id: 'visitors', desc: true }],
        emptyMessage: tEmpty('medium'),
      },
      {
        key: 'content',
        label: tTabs('content'),
        data: contentBreakdown as BaseUTMBreakdownItem[],
        columns: contentColumns,
        defaultSorting: [{ id: 'visitors', desc: true }],
        emptyMessage: tEmpty('content'),
      },
      {
        key: 'term',
        label: tTabs('terms'),
        data: termBreakdown as BaseUTMBreakdownItem[],
        columns: termColumns,
        defaultSorting: [{ id: 'visitors', desc: true }],
        emptyMessage: tEmpty('term'),
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
      tTabs,
      tEmpty,
    ],
  );

  return (
    <TabbedTable title={t('table.title')} description={t('table.description')} tabs={tabs} defaultTab='source' />
  );
}
