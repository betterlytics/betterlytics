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
    <Card
      className={`border-border flex h-full min-h-[300px] flex-col gap-1 p-2 sm:min-h-[400px] sm:px-6 sm:pt-3 ${className}`}
    >
      <Tabs defaultValue={activeDefaultTab}>
        <CardHeader className='px-0 pb-0'>
          <div className='relative grid grid-cols-1 items-center gap-2 xl:grid-cols-2'>
            <div
              className={cn('grid grid-cols-1 items-start gap-1 xl:grid-cols-2', searchColumn && 'sm:col-span-2')}
            >
              <CardTitle className='text-base font-medium'>{title}</CardTitle>
              <div className='flex'>
                {headerActions && <div className='justify-self-end'>{headerActions}</div>}
              </div>
            </div>
            {searchColumn && (
              <div className='flex h-9 w-full items-center rounded-md sm:max-w-sm'>
                <Input
                  placeholder={t('searchPlaceholder', {
                    field: searchFieldLabel || String(searchColumn),
                  })}
                  onChange={(event) =>
                    tableRef.current?.getColumn(searchColumn)?.setFilterValue(event.target.value)
                  }
                  className='cursor-input row-start-3 !h-[calc(100%-1px)] w-full !text-xs shadow-sm sm:row-start-2 sm:max-w-sm md:!text-xs'
                />
              </div>
            )}
            <div className='flex w-full items-center gap-4 sm:justify-end'>
              <TabsList className={`grid grid-cols-${tabs.length} bg-muted/30 w-full gap-1 px-0`}>
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
        <CardContent className='flex-1 px-0'>
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
