import React from 'react';
import { CampaignPerformance } from '@/entities/campaign';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';

interface CampaignPerformanceTableProps {
  data: CampaignPerformance[];
}

export default function CampaignPerformanceTable({ data }: CampaignPerformanceTableProps) {
  const t = useTranslations('components.campaign.performance');

  const columns: ColumnDef<CampaignPerformance>[] = [
    {
      accessorKey: 'name',
      header: t('columns.campaignName'),
      cell: ({ row }) => (
        <div className='truncate font-medium' title={row.original.name}>
          {row.original.name}
        </div>
      ),
      size: 250,
    },
    {
      accessorKey: 'visitors',
      header: t('columns.visitors'),
      cell: ({ row }) => <div>{row.original.visitors.toLocaleString()}</div>,
    },
    {
      accessorKey: 'bounceRate',
      header: t('columns.bounceRate'),
      cell: ({ row }) => <div className='font-medium'>{formatPercentage(row.original.bounceRate)}</div>,
      size: 120,
    },
    {
      accessorKey: 'avgSessionDuration',
      header: t('columns.avgSessionDuration'),
      cell: ({ row }) => <div>{row.original.avgSessionDuration}</div>,
      size: 180,
    },
    {
      accessorKey: 'pagesPerSession',
      header: t('columns.pagesPerSession'),
      cell: ({ row }) => <div>{row.original.pagesPerSession.toFixed(1)}</div>,
      size: 150,
    },
  ];

  return (
    <div className='bg-card border-border gap-3 rounded-lg border p-6 shadow'>
      <h2 className='text-foreground mb-1 text-lg font-bold'>{t('title')}</h2>
      <div className='mt-4'>
        <DataTable columns={columns} data={data} defaultSorting={[{ id: 'visitors', desc: true }]} />
      </div>
    </div>
  );
}
