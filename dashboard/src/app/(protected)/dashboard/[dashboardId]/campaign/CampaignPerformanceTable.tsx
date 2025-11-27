'use client';

import { useCallback, useMemo } from 'react';
import { CampaignLandingPagePerformanceItem, CampaignPerformance } from '@/entities/campaign';
import { DataTable } from '@/components/DataTable';
import { type ColumnDef, type Row } from '@tanstack/react-table';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';

interface CampaignPerformanceTableProps {
  data: CampaignPerformance[];
  landingPages: CampaignLandingPagePerformanceItem[];
}

export default function CampaignPerformanceTable({ data, landingPages }: CampaignPerformanceTableProps) {
  const t = useTranslations('components.campaign.performance');
  const landingTranslations = useTranslations('components.campaign.landing');
  const { queryFilters, removeQueryFilter } = useQueryFiltersContext();
  const { applyFilter } = useFilterClick({ behavior: 'replace-same-column' });

  const activeCampaignFilter = useMemo(
    () => queryFilters.find((filter) => filter.column === 'utm_campaign' && filter.operator === '='),
    [queryFilters],
  );
  const selectedCampaign = activeCampaignFilter?.value ?? null;

  const overviewColumns = useMemo<ColumnDef<CampaignPerformance>[]>(
    () => [
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
    ],
    [t],
  );

  const landingColumns = useMemo<ColumnDef<CampaignLandingPagePerformanceItem>[]>(
    () => [
      {
        accessorKey: 'campaignName',
        header: landingTranslations('columns.campaignName'),
        cell: ({ row }) => <div className='font-medium'>{row.original.campaignName}</div>,
      },
      {
        accessorKey: 'landingPageUrl',
        header: landingTranslations('columns.entryPage'),
        cell: ({ row }) => (
          <div className='max-w-xs truncate' title={row.original.landingPageUrl}>
            {row.original.landingPageUrl}
          </div>
        ),
      },
      {
        accessorKey: 'visitors',
        header: landingTranslations('columns.visitors'),
        cell: ({ row }) => <div>{formatNumber(row.original.visitors)}</div>,
      },
      {
        accessorKey: 'bounceRate',
        header: landingTranslations('columns.bounceRate'),
        cell: ({ row }) => <div>{formatPercentage(row.original.bounceRate)}</div>,
      },
      {
        accessorKey: 'avgSessionDuration',
        header: landingTranslations('columns.avgSessionDuration'),
        cell: ({ row }) => <div>{row.original.avgSessionDuration}</div>,
      },
      {
        accessorKey: 'pagesPerSession',
        header: landingTranslations('columns.pagesPerSession'),
        cell: ({ row }) => <div>{formatNumber(row.original.pagesPerSession)}</div>,
      },
    ],
    [landingTranslations],
  );

  const landingRows = useMemo(() => {
    if (!selectedCampaign) {
      return [];
    }
    return landingPages.filter((item) => item.campaignName === selectedCampaign);
  }, [landingPages, selectedCampaign]);

  const handleCampaignRowClick = useCallback(
    (row: Row<CampaignPerformance>) => {
      applyFilter('utm_campaign', row.original.name);
    },
    [applyFilter],
  );

  const handleResetView = useCallback(() => {
    if (activeCampaignFilter) {
      removeQueryFilter(activeCampaignFilter.id);
    }
  }, [activeCampaignFilter, removeQueryFilter]);

  const isLandingView = Boolean(selectedCampaign);

  return (
    <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-2'>
        <div className='relative grid grid-cols-1 items-center gap-2 xl:grid-cols-2'>
          <div className='grid grid-cols-1 items-start gap-1 xl:grid-cols-2'>
            <CardTitle className='text-base font-medium'>
              {isLandingView ? landingTranslations('title') : t('title')}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-0'>
        <div className='overflow-x-auto'>
          {isLandingView ? (
            <DataTable
              columns={landingColumns}
              data={landingRows}
              defaultSorting={[{ id: 'visitors', desc: true }]}
            />
          ) : (
            <DataTable
              columns={overviewColumns}
              data={data}
              defaultSorting={[{ id: 'visitors', desc: true }]}
              onRowClick={handleCampaignRowClick}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
