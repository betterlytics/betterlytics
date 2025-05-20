'use client';

import React from 'react';
import { CampaignLandingPagePerformanceItem } from "@/entities/campaign";
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface CampaignLandingPagePerformanceTableProps {
  data: CampaignLandingPagePerformanceItem[];
  isLoading: boolean;
}

const columns: ColumnDef<CampaignLandingPagePerformanceItem>[] = [
  {
    accessorKey: 'campaignName',
    header: 'Campaign Name',
    cell: ({ row }) => <div className="font-medium">{row.original.campaignName}</div>,
  },
  {
    accessorKey: 'landingPageUrl',
    header: 'Landing Page URL',
    cell: ({ row }) => (
      <a 
        href={row.original.landingPageUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary hover:underline truncate block max-w-xs"
        title={row.original.landingPageUrl}
      >
        {row.original.landingPageUrl}
      </a>
    ),
  },
  {
    accessorKey: 'visitors',
    header: () => <div className="text-right">Visitors</div>,
    cell: ({ row }) => <div className="text-right">{row.original.visitors.toLocaleString()}</div>,
  },
  {
    accessorKey: 'bounceRate',
    header: () => <div className="text-right">Bounce Rate</div>,
    cell: ({ row }) => <div className="text-right">{row.original.bounceRate.toFixed(1)}%</div>,
  },
  {
    accessorKey: 'avgSessionDuration',
    header: () => <div className="text-right">Avg. Session Duration</div>,
    cell: ({ row }) => <div className="text-right">{row.original.avgSessionDuration}</div>,
  },
  {
    accessorKey: 'pagesPerSession',
    header: () => <div className="text-right">Pages / Session</div>,
    cell: ({ row }) => <div className="text-right">{row.original.pagesPerSession.toFixed(1)}</div>,
  },
];

export default function CampaignLandingPagePerformanceTable({
  data,
  isLoading,
}: CampaignLandingPagePerformanceTableProps) {
  return (
    <div className="bg-card rounded-lg shadow border border-border p-6 col-span-1 lg:col-span-3">
      <h2 className="text-lg font-bold text-foreground mb-1">Campaign Landing Page Performance</h2>
      <p className="text-sm text-muted-foreground mb-4">Key metrics for campaign landing pages</p>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        defaultSorting={[{ id: 'visitors', desc: true }]}
      />
    </div>
  );
} 