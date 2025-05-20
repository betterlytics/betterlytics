'use client';

import { BrowserStats } from "@/entities/devices";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

interface BrowserTableProps {
  data: BrowserStats[];
  isLoading: boolean;
}

export default function BrowserTable({ data, isLoading }: BrowserTableProps) {

  const columns: ColumnDef<BrowserStats>[] = [
    {
      accessorKey: 'browser',
      header: 'Browser',
    },
    {
      accessorKey: 'visitors',
      header: 'Visitors',
      cell: ({ row }) => row.original.visitors.toLocaleString(),
    },
    {
      accessorKey: 'percentage',
      header: 'Percentage',
      cell: ({ row }) => `${row.original.percentage}%`,
    },
  ];

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        defaultSorting={[{ id: 'visitors', desc: true }]}
        className="w-full"
      />
    </div>
  );
} 