'use client';

import { use, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { fetchOutboundLinksAnalyticsAction } from '@/app/actions/outboundLinks';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCompareCell } from '@/components/TableCompareCell';
import ExternalLink from '@/components/ExternalLink';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

type TableOutboundLinkRow = Awaited<ReturnType<typeof fetchOutboundLinksAnalyticsAction>>[number];

type OutboundLinksTableSectionProps = {
  outboundLinksAnalyticsPromise: ReturnType<typeof fetchOutboundLinksAnalyticsAction>;
};

export default function OutboundLinksTableSection({
  outboundLinksAnalyticsPromise,
}: OutboundLinksTableSectionProps) {
  const outboundLinksData = use(outboundLinksAnalyticsPromise);
  const t = useTranslations('components.outboundLinks.table');

  const columns: ColumnDef<TableOutboundLinkRow>[] = useMemo(
    () => [
      {
        accessorKey: 'outbound_link_url',
        header: t('destinationUrl'),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <ExternalLinkIcon className='h-4 w-4 flex-shrink-0' />
            <ExternalLink
              href={`https://${row.original.current.outbound_link_url}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 font-medium break-all transition-colors hover:text-blue-600'
            >
              {row.original.current.outbound_link_url}
            </ExternalLink>
          </div>
        ),
        accessorFn: (row) => row.current.outbound_link_url,
      },
      {
        accessorKey: 'clicks',
        header: t('uniqueClicks'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='clicks' />,
        accessorFn: (row) => row.current.clicks,
      },
      {
        accessorKey: 'top_source_url',
        header: t('topReferrerPage'),
        cell: ({ row }) => <span className='text-sm break-all'>{row.original.current.top_source_url}</span>,
        accessorFn: (row) => row.current.top_source_url,
      },
      {
        accessorKey: 'source_url_count',
        header: t('sourcePages'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='source_url_count' />,
        accessorFn: (row) => row.current.source_url_count,
      },
    ],
    [t],
  );

  return (
    <Card className='border-border flex min-h-[300px] flex-col gap-1 p-2 sm:min-h-[400px] sm:px-6 sm:pt-3'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-lg font-medium'>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        <DataTable data={outboundLinksData} columns={columns} />
      </CardContent>
    </Card>
  );
}
