'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { PageAnalytics } from "@/entities/pages";
import { formatDuration } from '@/utils/dateFormatters';

interface PagesTableProps {
  data: PageAnalytics[];
}

const generatePageDetailUrl = (path: string): string => {
  return `/dashboard/pages/page-detail?path=${encodeURIComponent(path)}`;
};

const formatPath = (path: string): string => {
  return path || "/";
};

export default function PagesTable({ data }: PagesTableProps) {

  const columns: ColumnDef<PageAnalytics>[] = [
    {
      accessorKey: 'path',
      header: 'Path',
      cell: ({ row }) => formatPath(row.original.path),
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: ({ row }) => row.original.visitors.toLocaleString(),
    },
    {
      accessorKey: 'pageviews',
      header: 'Pageviews',
      cell: ({ row }) => row.original.pageviews.toLocaleString(),
    },
    {
      accessorKey: 'bounceRate',
      header: 'Bounce Rate',
      cell: ({ row }) => `${row.original.bounceRate}%`,
    },
    {
      accessorKey: 'avgTime',
      header: 'Avg. Time',
      cell: ({ row }) => formatDuration(row.original.avgTime),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => {
        const pageDetailUrl = generatePageDetailUrl(row.original.path);
        return (
          <Link 
            href={pageDetailUrl} 
            className="text-gray-400 hover:text-gray-600 flex justify-end"
            onClick={(e) => e.stopPropagation()} // Prevent row click from firing
          >
            <ArrowUpRight size={16} />
          </Link>
        );
      },
      enableSorting: false,
    },
  ];

  const handleRowClick = (row: PageAnalytics) => {
    const pageDetailUrl = generatePageDetailUrl(row.path);
    window.location.href = pageDetailUrl;
  };

  return (
    <div className="bg-card rounded-lg shadow border border-border p-6">
      <h2 className="text-lg font-bold text-foreground mb-1">All Pages</h2>
      <p className="text-sm text-muted-foreground mb-4">Analytics for all tracked pages</p>
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={data}
          defaultSorting={[{ id: 'pageviews', desc: true }]}
          onRowClick={(row) => handleRowClick(row.original)}
        />
      </div>
    </div>
  );
} 