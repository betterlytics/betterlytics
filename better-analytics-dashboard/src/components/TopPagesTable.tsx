'use client';

import React from 'react';
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

interface PageData {
  url: string;
  visitors: number;
}
interface TopPagesTableProps {
  pages: PageData[];
  isLoading?: boolean;
}

export default function TopPagesTable({ pages, isLoading = false }: TopPagesTableProps) {
  const columns: ColumnDef<PageData>[] = [
    {
      accessorKey: 'url',
      header: 'Page',
      cell: ({ row }) => (
        <span className="font-mono text-blue-700">
          {row.original.url}
        </span>
      ),
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: ({ row }) => row.original.visitors.toLocaleString(),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          role="link"
          className="flex justify-center items-center text-gray-500 hover:text-gray-700"
          onClick={(e) => e.stopPropagation()}
          tabIndex={0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-1">Top Pages</h2>
      <p className="text-sm text-muted-foreground mb-4">Most visited pages</p>
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={pages}
          loading={isLoading}
          defaultSorting={[{ id: 'visitors', desc: true }]}
          className="w-full"
        />
      </div>
    </div>
  );
}