'use client';

import React from 'react';
import { CampaignLandingPagePerformanceItem } from '@/entities/campaign';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import ExternalLink from '@/components/ExternalLink';
import { useTranslations } from 'next-intl';

interface CampaignLandingPagePerformanceTableProps {
  data: CampaignLandingPagePerformanceItem[];
}

export default function CampaignLandingPagePerformanceTable({ data }: CampaignLandingPagePerformanceTableProps) {
  const t = useTranslations('components.campaign.landing');
  const tCols = useTranslations('components.campaign.landing.columns');

  const columns: ColumnDef<CampaignLandingPagePerformanceItem>[] = [
    {
      accessorKey: 'campaignName',
      header: tCols('campaignName'),
      cell: ({ row }) => <div className='font-medium'>{row.original.campaignName}</div>,
    },
    {
      accessorKey: 'landingPageUrl',
      header: tCols('landingPageUrl'),
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
      header: tCols('visitors'),
      cell: ({ row }) => <div>{row.original.visitors.toLocaleString()}</div>,
    },
    {
      accessorKey: 'bounceRate',
      header: tCols('bounceRate'),
      cell: ({ row }) => <div>{row.original.bounceRate.toFixed(1)}%</div>,
    },
    {
      accessorKey: 'avgSessionDuration',
      header: tCols('avgSessionDuration'),
      cell: ({ row }) => <div>{row.original.avgSessionDuration}</div>,
    },
    {
      accessorKey: 'pagesPerSession',
      header: tCols('pagesPerSession'),
      cell: ({ row }) => <div>{row.original.pagesPerSession.toFixed(1)}</div>,
    },
  ];
  return (
    <div className='bg-card border-border col-span-1 rounded-lg border p-6 shadow lg:col-span-3'>
      <h2 className='text-foreground mb-1 text-lg font-bold'>{t('title')}</h2>
      <p className='text-muted-foreground mb-4 text-sm'>{t('description')}</p>
      <DataTable columns={columns} data={data} defaultSorting={[{ id: 'visitors', desc: true }]} />
    </div>
  );
}
