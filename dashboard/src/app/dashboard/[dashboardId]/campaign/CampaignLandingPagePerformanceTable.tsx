'use client';

import React from 'react';
import { CampaignLandingPagePerformanceItem } from '@/entities/campaign';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import ExternalLink from '@/components/ExternalLink';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface CampaignLandingPagePerformanceTableProps {
  data: CampaignLandingPagePerformanceItem[];
}

export default function CampaignLandingPagePerformanceTable({ data }: CampaignLandingPagePerformanceTableProps) {
  const t = useTranslations('components.campaign.landing');

  const columns: ColumnDef<CampaignLandingPagePerformanceItem>[] = [
    {
      accessorKey: 'campaignName',
      header: t('columns.campaignName'),
      cell: ({ row }) => <div className='font-medium'>{row.original.campaignName}</div>,
    },
    {
      accessorKey: 'landingPageUrl',
      header: t('columns.landingPageUrl'),
      cell: ({ row }) => (
        <ExternalLink
          href={row.original.landingPageUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary block max-w-xs truncate hover:underline'
          title={row.original.landingPageUrl}
        >
          {row.original.landingPageUrl}
        </ExternalLink>
      ),
    },
    {
      accessorKey: 'visitors',
      header: t('columns.visitors'),
      cell: ({ row }) => <div>{formatNumber(row.original.visitors)}</div>,
    },
    {
      accessorKey: 'bounceRate',
      header: t('columns.bounceRate'),
      cell: ({ row }) => <div>{formatPercentage(row.original.bounceRate)}</div>,
    },
    {
      accessorKey: 'avgSessionDuration',
      header: t('columns.avgSessionDuration'),
      cell: ({ row }) => <div>{row.original.avgSessionDuration}</div>,
    },
    {
      accessorKey: 'pagesPerSession',
      header: t('columns.pagesPerSession'),
      cell: ({ row }) => <div>{formatNumber(row.original.pagesPerSession)}</div>,
    },
  ];
  return (
    <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-base font-medium'>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        <DataTable columns={columns} data={data} defaultSorting={[{ id: 'visitors', desc: true }]} />
      </CardContent>
    </Card>
  );
}
