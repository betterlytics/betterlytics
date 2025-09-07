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
  description?: string;
  tabs: TabDefinition<TData>[];
  defaultTab?: string;
  className?: string;
  headerActions?: ReactNode;
  searchColumn?: string;
  searchFieldLabel?: string;
}

function TabbedTable<TData>({
  title,
  description,
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
    <Card className={`bg-card border-border rounded-lg border shadow ${className}`}>
      <Tabs defaultValue={activeDefaultTab}>
        <CardHeader className='px-1 pb-0 sm:px-6'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className={cn('grid grid-cols-[1fr_auto] items-start gap-2', searchColumn && 'sm:col-span-2')}>
              <CardTitle className='mb-1 text-lg font-semibold'>{title}</CardTitle>
              {headerActions && <div className='justify-self-end'>{headerActions}</div>}
              {description && <p className='text-muted-foreground col-span-2 text-sm'>{description}</p>}
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
                  className='bg-input row-start-3 w-full sm:row-start-2 sm:max-w-sm'
                />
              </div>
            )}
            <div className='flex items-center justify-center gap-4 sm:justify-end'>
              <TabsList className={`bg-muted/30 grid h-8 w-auto grid-cols-${tabs.length}`}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className='hover:bg-accent px-3 py-1 text-xs font-medium'
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
