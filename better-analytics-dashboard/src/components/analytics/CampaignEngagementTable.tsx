'use client';

import React from 'react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef, Row } from '@tanstack/react-table';
import { CampaignSourceBreakdownItem, CampaignMediumBreakdownItem, CampaignContentBreakdownItem, CampaignTermBreakdownItem } from "@/entities/campaign";
import { formatPercentage, capitalizeFirstLetter } from '@/utils/formatters';

export type CampaignEngagementDataItem = 
  | CampaignSourceBreakdownItem 
  | CampaignMediumBreakdownItem 
  | CampaignContentBreakdownItem 
  | CampaignTermBreakdownItem;

export interface CampaignEngagementTableProps<TData extends CampaignEngagementDataItem> {
  data: TData[];
  isLoading: boolean;
  title: string;
  subtitle: string;
  dataKey: keyof TData;
  onRowClick?: (row: Row<TData>) => void;
}

export function createCampaignEngagementColumns<TData extends CampaignEngagementDataItem>(
  dataKey: keyof TData, 
  dataKeyHeader: string
): ColumnDef<TData>[] {
  return [
    {
      accessorKey: dataKey,
      header: dataKeyHeader,
      cell: ({ row }) => <div className="font-medium">{String(row.getValue(dataKey as string))}</div>,
    },
    {
      accessorKey: 'visitors',
      header: () => <div className="text-right">Visitors</div>,
      cell: ({ row }) => <div className="text-right">{row.getValue<number>('visitors').toLocaleString()}</div>,
    },
    {
      accessorKey: 'bounceRate',
      header: () => <div className="text-right">Bounce Rate</div>,
      cell: ({ row }) => <div className="text-right">{formatPercentage(row.getValue<number>('bounceRate'))}</div>,
    },
    {
      accessorKey: 'avgSessionDuration',
      header: () => <div className="text-right">Avg. Session Duration</div>,
      cell: ({ row }) => <div className="text-right">{row.getValue('avgSessionDuration')}</div>,
    },
    {
      accessorKey: 'pagesPerSession',
      header: () => <div className="text-right">Pages / Session</div>,
      cell: ({ row }) => <div className="text-right">{row.getValue<number>('pagesPerSession').toFixed(1)}</div>,
    },
  ];
}

export default function CampaignEngagementTable<TData extends CampaignEngagementDataItem>({
  data,
  isLoading,
  title,
  subtitle,
  dataKey,
  onRowClick,
}: CampaignEngagementTableProps<TData>) {
  
  const columns = React.useMemo(() => {
    let headerText = 'Dimension';
    if (typeof dataKey === 'string') {
      headerText = capitalizeFirstLetter(dataKey);
    }
    return createCampaignEngagementColumns<TData>(dataKey, headerText);
  }, [dataKey]);

  return (
    <div className="bg-card rounded-lg shadow border border-border p-6">
      <h2 className="text-lg font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        defaultSorting={[{ id: 'visitors', desc: true }]}
        onRowClick={onRowClick}
      />
    </div>
  );
} 