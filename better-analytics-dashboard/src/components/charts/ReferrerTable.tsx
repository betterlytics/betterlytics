'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { formatDuration } from '@/utils/dateFormatters';
import { ReferrerTableRow } from '@/entities/referrers';
import { getReferrerColor } from '@/utils/referrerColors';
import { Globe, Link } from 'lucide-react';
import { DataTable } from '@/components/DataTable';

export const ReferrerTab = {
  All: 'all',
  Search: 'search',
  Social: 'social',
  Direct: 'direct',
  Email: 'email',
  Other: 'other',
} as const;

export type ReferrerTabKey = typeof ReferrerTab[keyof typeof ReferrerTab];
export type ReferrerTabValue = keyof typeof ReferrerTab;

const SourceTypeBadge = ({ type }: { type: string }) => {
  const color = getReferrerColor(type);

  const bgColorStyle = {
    backgroundColor: `${color}33`,
    color: color,
    border: `1px solid ${color}80`,
  };

  return (
    <span className="px-2 py-1 rounded-full text-xs font-bold" style={bgColorStyle}>
      {type}
    </span>
  );
};

interface ReferrerTableProps {
  data?: ReferrerTableRow[];
  loading: boolean;
}

export default function ReferrerTable({ data = [], loading }: ReferrerTableProps) {
  const [activeTab, setActiveTab] = useState<ReferrerTabKey>(ReferrerTab.All);

  const totalVisits = data.reduce((sum, row) => sum + row.visits, 0);

  // Filter data based on active tab
  const filteredData = data.filter((row) => {
    if (activeTab === ReferrerTab.All) return true;
    return row.source_type.toLowerCase() === activeTab.toLowerCase();
  });

  const columns: ColumnDef<ReferrerTableRow>[] = [
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="font-medium">
            <div className="flex items-center gap-2">
              {data.source_type.toLowerCase() === 'direct' ? (
                <Globe className="h-4 w-4 text-gray-500" />
              ) : (
                <Link className="h-4 w-4 text-gray-500" />
              )}
              {data.source_url
                ? data.source_url
                : data.source_type.toLowerCase() === 'direct'
                ? 'Direct'
                : 'Unknown'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'source_type',
      header: 'Type',
      cell: ({ row }) => <SourceTypeBadge type={row.original.source_type} />,
    },
    {
      accessorKey: 'visits',
      header: 'Visits',
      cell: ({ row }) => formatNumber(row.original.visits),
    },
    {
      id: 'percentage',
      header: 'Percentage',
      accessorFn: (row: ReferrerTableRow) => {
        if (totalVisits === 0) {
          return 0;
        }
        return (row.visits / totalVisits) * 100;
      },
      cell: ({ getValue }) => formatPercentage(getValue<number>()),
      enableSorting: true,
    },
    {
      accessorKey: 'bounce_rate',
      header: 'Bounce Rate',
      cell: ({ row }) => formatPercentage(row.original.bounce_rate),
    },
    {
      accessorKey: 'avg_visit_duration',
      header: 'Avg. Visit Duration',
      cell: ({ row }) => formatDuration(row.original.avg_visit_duration),
    },
  ];

  return (
    <div>
      <div className="border-b border-border mb-4">
        <div className="flex space-x-4 overflow-x-auto">
          {(Object.entries(ReferrerTab) as [ReferrerTabValue, ReferrerTabKey][]).map(
            ([key, value]) => (
              <button
                key={value}
                className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === value
                    ? 'border-gray-800 text-gray-800'
                    : 'border-transparent hover:border-gray-300 text-gray-600'
                }`}
                onClick={() => setActiveTab(value)}
              >
                {key}
              </button>
            )
          )}
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData} 
        loading={loading} 
        defaultSorting={[{ id: 'visits', desc: true }]}
        className="rounded-md"
      />
    </div>
  );
}
