'use client';

import { ColumnDef, Table } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReactNode, useRef } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface TabDefinition<TData> {
  key: string;
  label: string;
  data: TData[];
  columns: ColumnDef<TData>[];
  defaultSorting?: { id: string; desc: boolean }[];
  emptyMessage?: string;
}

interface TabbedTableProps<TData> {
  title: ReactNode;
  tabs: TabDefinition<TData>[];
  defaultTab?: string;
  className?: string;
  headerActions?: ReactNode;
  searchColumn?: string;
  searchFieldLabel?: string;
}

function TabbedTable<TData>({
  title,
  tabs,
  defaultTab,
  className = '',
  headerActions,
  searchColumn,
  searchFieldLabel,
}: TabbedTableProps<TData>) {
  const activeDefaultTab = defaultTab || tabs[0]?.key;
  const tableRef = useRef<Table<TData> | null>(null);
  const t = useTranslations('components.tabbedTable');

  return (
    <Card className={`bg-card border-border rounded-xl border shadow ${className}`}>
      <Tabs defaultValue={activeDefaultTab}>
        <CardHeader className='px-4 pb-0 sm:px-6'>
          <div className='relative grid grid-cols-1 gap-3 xl:grid-cols-2'>
            <div
              className={cn('grid grid-cols-1 items-start gap-2 xl:grid-cols-2', searchColumn && 'sm:col-span-2')}
            >
              <CardTitle className='mb-1 text-lg font-medium'>{title}</CardTitle>
              <div className='flex'>
                {headerActions && <div className='justify-self-end'>{headerActions}</div>}
              </div>
            </div>
            {searchColumn && (
              <div className='w-full rounded-md sm:max-w-sm'>
                <Input
                  placeholder={t('searchPlaceholder', {
                    field: searchFieldLabel || String(searchColumn),
                  })}
                  onChange={(event) =>
                    tableRef.current?.getColumn(searchColumn)?.setFilterValue(event.target.value)
                  }
                  className='cursor-input row-start-3 w-full shadow-sm sm:row-start-2 sm:max-w-sm'
                />
              </div>
            )}
            <div className='flex items-center gap-4 overflow-auto sm:justify-end'>
              <TabsList className={`bg-muted/30 flex h-8 gap-1`}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className='hover:bg-accent cursor-pointer px-3 py-1 text-xs font-medium'
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-1 pt-0 pb-4 sm:px-6'>
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <div className='overflow-x-auto'>
                <DataTable
                  columns={tab.columns}
                  data={tab.data}
                  defaultSorting={tab.defaultSorting || [{ id: 'visitors', desc: true }]}
                  tableRef={tableRef}
                />
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
