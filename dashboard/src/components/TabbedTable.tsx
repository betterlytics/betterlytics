'use client';

import { ColumnDef, Table } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReactNode, useRef } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

interface TabDefinition<TData> {
  key: string;
  label: string;
  data: TData[];
  columns: ColumnDef<TData>[];
  defaultSorting?: { id: string; desc: boolean }[];
  emptyMessage?: string;
}

interface TabbedTableProps<TData> {
  title: string;
  description?: string;
  tabs: TabDefinition<TData>[];
  defaultTab?: string;
  className?: string;
  headerActions?: ReactNode;
  searchColumn?: string;
}

function TabbedTable<TData>({
  title,
  description,
  tabs,
  defaultTab,
  className = '',
  headerActions,
  searchColumn,
}: TabbedTableProps<TData>) {
  const activeDefaultTab = defaultTab || tabs[0]?.key;
  const tableRef = useRef<Table<TData> | null>(null);

  return (
    <Card className={`bg-card border-border rounded-lg border shadow ${className}`}>
      <Tabs defaultValue={activeDefaultTab}>
        <CardHeader className='pb-0'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className={cn(searchColumn && 'sm:col-span-2')}>
              <CardTitle className='mb-1 text-lg font-semibold'>{title}</CardTitle>
              {description && <p className='text-muted-foreground text-sm'>{description}</p>}
            </div>
            {searchColumn && (
              <Input
                placeholder={`Filter by ${searchColumn}...`}
                onChange={(event) => tableRef.current?.getColumn(searchColumn)?.setFilterValue(event.target.value)}
                className='row-start-3 max-w-sm sm:row-start-2'
              />
            )}
            <div className='flex items-center justify-center gap-4 sm:justify-end'>
              {headerActions && <div>{headerActions}</div>}
              <TabsList className={`bg-muted/30 grid h-8 w-auto grid-cols-${tabs.length}`}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className='px-3 py-1 text-xs font-medium hover:bg-[var(--hover)]'
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-6 pt-0 pb-4'>
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <div className='overflow-x-auto'>
                {tab.data.length === 0 ? (
                  <div className='flex h-32 items-center justify-center'>
                    <p className='text-muted-foreground text-sm'>
                      {tab.emptyMessage || `No ${tab.label.toLowerCase()} data available`}
                    </p>
                  </div>
                ) : (
                  <DataTable
                    columns={tab.columns}
                    data={tab.data}
                    defaultSorting={tab.defaultSorting || [{ id: 'visitors', desc: true }]}
                    tableRef={tableRef}
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </CardContent>
      </Tabs>
    </Card>
  );
}

export default TabbedTable;
export type { TabDefinition };
