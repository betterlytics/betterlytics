import React from 'react';
import { CampaignPerformance } from '@/entities/campaign';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className='border-border flex min-h-[300px] flex-col gap-1 p-2 sm:min-h-[400px] sm:px-6 sm:pt-3'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-base font-medium'>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        <DataTable columns={columns} data={data} defaultSorting={[{ id: 'visitors', desc: true }]} />
      </CardContent>
    </Card>
  );
}
