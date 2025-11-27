import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import type { CampaignExpandedDetails } from '@/app/actions/campaigns';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

type CampaignLandingPagesTableProps = {
  landingPages: CampaignExpandedDetails['landingPages'];
};

type LandingPageRow = {
  landingPageUrl: string;
  visitors: number;
  bounceRate: number;
  avgSessionDuration: string;
  pagesPerSession: number;
};

const columns: ColumnDef<LandingPageRow>[] = [
  {
    accessorKey: 'landingPageUrl',
    header: 'Entry page',
    cell: ({ row }) => {
      const value = row.getValue<string>('landingPageUrl');
      return (
        <span className='max-w-[220px] truncate' title={value}>
          {value}
        </span>
      );
    },
  },
  {
    accessorKey: 'visitors',
    header: 'Visitors',
    cell: ({ row }) => <span>{formatNumber(row.getValue<number>('visitors'))}</span>,
  },
  {
    accessorKey: 'bounceRate',
    header: 'Bounce',
    cell: ({ row }) => <span>{formatPercentage(row.getValue<number>('bounceRate'))}</span>,
  },
  {
    accessorKey: 'avgSessionDuration',
    header: 'Avg. session',
    cell: ({ row }) => <span>{row.getValue<string>('avgSessionDuration')}</span>,
  },
  {
    accessorKey: 'pagesPerSession',
    header: 'Pages / session',
    cell: ({ row }) => <span>{row.getValue<number>('pagesPerSession').toFixed(1)}</span>,
  },
];

export default function CampaignLandingPagesTable({ landingPages }: CampaignLandingPagesTableProps) {
  const topLandingPages = landingPages.slice(0, 5) as LandingPageRow[];

  if (topLandingPages.length === 0) {
    return (
      <Card className='border-border/60 h-full'>
        <CardContent className='flex h-full items-center justify-center py-6'>
          <p className='text-muted-foreground text-xs'>
            No landing page data for this campaign in the selected range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/60 h-full'>
      <CardHeader className='px-3 pt-3 pb-2 sm:px-4 sm:pt-3 sm:pb-2'>
        <CardTitle className='text-sm font-medium'>Landing pages</CardTitle>
      </CardHeader>
      <CardContent className='px-3 pt-0 pb-3 sm:px-4'>
        <DataTable
          columns={columns}
          data={topLandingPages}
          defaultSorting={[{ id: 'visitors', desc: true }]}
          className='text-xs'
        />
      </CardContent>
    </Card>
  );
}
