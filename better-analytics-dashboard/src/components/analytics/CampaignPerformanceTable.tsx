import React from 'react';
import { CampaignPerformance } from "@/entities/campaign";
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { getBounceRateColor } from "@/utils/bounceRateColors";
import { formatPercentage } from '@/utils/formatters';

interface CampaignPerformanceTableProps {
  data: CampaignPerformance[];
  isLoading: boolean;
}

const columns: ColumnDef<CampaignPerformance>[] = [
  {
    accessorKey: 'name',
    header: 'Campaign Name',
    cell: ({ row }) => <div className="font-medium truncate" title={row.original.name}>{row.original.name}</div>,
    size: 250,
  },
  {
    accessorKey: 'visitors',
    header: () => <div className="text-right">Visitors</div>,
    cell: ({ row }) => <div className="text-right">{row.original.visitors.toLocaleString()}</div>,
  },
  {
    accessorKey: 'bounceRate',
    header: () => <div className="text-right">Bounce Rate</div>,
    cell: ({ row }) => <div className={`text-right font-medium ${getBounceRateColor(row.original.bounceRate)}`}>{formatPercentage(row.original.bounceRate)}</div>,
    size: 120,
  },
  {
    accessorKey: 'avgSessionDuration',
    header: () => <div className="text-right">Avg. Session Duration</div>,
    cell: ({ row }) => <div className="text-right">{row.original.avgSessionDuration}</div>,
    size: 180,
  },
  {
    accessorKey: 'pagesPerSession',
    header: () => <div className="text-right">Pages / Session</div>,
    cell: ({ row }) => <div className="text-right">{row.original.pagesPerSession.toFixed(1)}</div>,
    size: 150,
  },
];

export default function CampaignPerformanceTable({
  data,
  isLoading,
}: CampaignPerformanceTableProps) {
  return (
    <div className="bg-card rounded-lg shadow border border-border p-6">
      <h2 className="text-lg font-bold text-foreground mb-1">Campaign Performance</h2>
      <p className="text-sm text-muted-foreground mb-4">Key metrics for your campaigns</p>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        defaultSorting={[{ id: 'visitors', desc: true }]}
      />
    </div>
  );
} 