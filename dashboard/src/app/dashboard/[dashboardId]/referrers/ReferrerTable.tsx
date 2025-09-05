'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { formatDuration } from '@/utils/dateFormatters';
import { ReferrerTableRow } from '@/entities/referrers';
import { getReferrerColor } from '@/utils/referrerColors';
import { Globe, Link } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { ToDataTable } from '@/presenters/toDataTable';
import { TableCompareCell } from '@/components/TableCompareCell';
import { useTranslations } from 'next-intl';

export const ReferrerTab = {
  All: 'all',
  Search: 'search',
  Social: 'social',
  Direct: 'direct',
  Email: 'email',
  Other: 'other',
} as const;

export type ReferrerTabKey = (typeof ReferrerTab)[keyof typeof ReferrerTab];
export type ReferrerTabValue = keyof typeof ReferrerTab;

const SourceTypeBadge = ({ type }: { type: string }) => {
  const color = getReferrerColor(type);

  const bgColorStyle = {
    backgroundColor: `${color}33`,
    color: color,
    border: `1px solid ${color}80`,
  };

  return (
    <span className='rounded-full px-2 py-1 text-xs font-bold' style={bgColorStyle}>
      {type}
    </span>
  );
};

interface ReferrerTableProps {
  data?: ToDataTable<'source_name', ReferrerTableRow>[];
}

export default function ReferrerTable({ data = [] }: ReferrerTableProps) {
  const [activeTab, setActiveTab] = useState<ReferrerTabKey>(ReferrerTab.All);
  const t = useTranslations('components.referrers.table');

  const totalVisits = data.reduce((sum, row) => sum + row.current.visits, 0);

  // Filter data based on active tab
  const filteredData = data.filter((row) => {
    if (activeTab === ReferrerTab.All) return true;
    return row.current.source_type.toLowerCase() === activeTab.toLowerCase();
  });

  const columns: ColumnDef<ToDataTable<'source_name', ReferrerTableRow>>[] = [
    {
      accessorKey: 'source',
      header: t('columns.source'),
      cell: ({ row }) => {
        const data = row.original.current;
        return (
          <div className='font-medium'>
            <div className='flex items-center gap-2'>
              {data.source_type.toLowerCase() === 'direct' ? (
                <Globe className='h-4 w-4 text-gray-500' />
              ) : (
                <Link className='h-4 w-4 text-gray-500' />
              )}
              {data.source_url
                ? data.source_url
                : data.source_type.toLowerCase() === 'direct'
                  ? t('columns.direct')
                  : t('columns.unknown')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'source_type',
      header: t('columns.type'),
      cell: ({ row }) => <SourceTypeBadge type={row.original.current.source_type} />,
    },
    {
      accessorKey: 'visits',
      header: t('columns.visits'),
      cell: ({ row }) => <TableCompareCell row={row.original} dataKey='visits' formatter={formatNumber} />,
      accessorFn: (row) => row.current.visits,
    },
    {
      id: 'percentage',
      header: t('columns.percentage'),
      accessorFn: (row) => {
        if (totalVisits === 0) {
          return 0;
        }
        return (row.current.visits / totalVisits) * 100;
      },
      cell: ({ getValue }) => formatPercentage(getValue<number>()),
      enableSorting: true,
    },
    {
      accessorKey: 'bounce_rate',
      header: t('columns.bounceRate'),
      cell: ({ row }) => (
        <TableCompareCell row={row.original} dataKey='bounce_rate' formatter={formatPercentage} />
      ),
      accessorFn: (row) => row.current.bounce_rate,
    },
    {
      accessorKey: 'avg_visit_duration',
      header: t('columns.avgVisitDuration'),
      cell: ({ row }) => (
        <TableCompareCell row={row.original} dataKey='avg_visit_duration' formatter={formatDuration} />
      ),
      accessorFn: (row) => row.current.avg_visit_duration,
    },
  ];

  return (
    <div>
      <div className='border-border mb-4 border-b'>
        <div className='flex space-x-4 overflow-x-auto'>
          {(Object.values(ReferrerTab) as ReferrerTabKey[]).map((value) => (
            <button
              key={value}
              className={`border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === value
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(value)}
            >
              {t(`tabs.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        defaultSorting={[{ id: 'visits', desc: true }]}
        className='rounded-md'
      />
    </div>
  );
}
