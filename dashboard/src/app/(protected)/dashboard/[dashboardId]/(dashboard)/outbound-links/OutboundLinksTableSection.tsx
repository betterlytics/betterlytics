'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCompareCell } from '@/components/TableCompareCell';
import ExternalLink from '@/components/ExternalLink';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatNumber, formatString } from '@/utils/formatters';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/trpc/routers/_app';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TableOutboundLinkRow = RouterOutputs['outboundLinks']['analytics'][number];

export default function OutboundLinksTableSection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.outboundLinks.analytics.useQuery(input, options);
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
              {formatString(row.original.current.outbound_link_url)}
            </ExternalLink>
          </div>
        ),
        accessorFn: (row) => row.current.outbound_link_url,
      },
      {
        accessorKey: 'clicks',
        header: t('uniqueClicks'),
        cell: ({ row }) => <TableCompareCell row={row.original} dataKey='clicks' formatter={formatNumber} />,
        accessorFn: (row) => row.current.clicks,
      },
      {
        accessorKey: 'top_source_url',
        header: t('topReferrerPage'),
        cell: ({ row }) => (
          <span className='text-sm break-all'>{formatString(row.original.current.top_source_url)}</span>
        ),
        accessorFn: (row) => row.current.top_source_url,
      },
      {
        accessorKey: 'source_url_count',
        header: t('sourcePages'),
        cell: ({ row }) => (
          <TableCompareCell row={row.original} dataKey='source_url_count' formatter={formatNumber} />
        ),
        accessorFn: (row) => row.current.source_url_count,
      },
    ],
    [t],
  );

  return (
    <QuerySection query={query} fallback={<TableSkeleton />}>
      {(outboundLinksData) => (
        <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
          <CardHeader className='px-0 pb-0'>
            <CardTitle className='text-base font-medium'>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className='px-0'>
            <DataTable data={outboundLinksData} columns={columns} />
          </CardContent>
        </Card>
      )}
    </QuerySection>
  );
}
