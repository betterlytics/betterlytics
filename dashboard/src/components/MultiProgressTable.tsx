'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProgressBarList, type ProgressBarData } from '@/components/ProgressBarList';
import { Spinner } from '@/components/ui/spinner';
import MultiProgressTableRowSkeleton from '@/components/skeleton/MultiProgressTableSkeleton';
import { cn } from '@/lib/utils';

export type { ProgressBarData, ProgressBarRowFilter } from '@/components/ProgressBarList';

interface TabConfig<T extends ProgressBarData> {
  key: string;
  label: string;
  data: T[];
  loading?: boolean;
  customContent?: React.ReactNode;
  customLoader?: React.ReactNode;
}

interface MultiProgressTableProps<T extends ProgressBarData> {
  title: string;
  tabs: TabConfig<T>[];
  defaultTab?: string;
  loading?: boolean;
  footer?: React.ReactNode;
  onItemClick?: (tabKey: string, item: T) => void;
  onTabChange?: (tabKey: string) => void;
  isItemInteractive?: (tabKey: string, item: T) => boolean;
}

function MultiProgressTable<T extends ProgressBarData>({
  title,
  tabs,
  defaultTab,
  loading,
  footer,
  onItemClick,
  onTabChange,
  isItemInteractive,
}: MultiProgressTableProps<T>) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const activeTabIndex = useMemo(
    () =>
      Math.max(
        0,
        tabs.findIndex((tab) => tab.key === activeTab),
      ),
    [tabs, activeTab],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      onTabChange?.(value);
    },
    [onTabChange],
  );

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const renderTabContent = useCallback(
    (tab: TabConfig<T>) => {
      if (tab.loading) {
        return tab.customLoader ?? <MultiProgressTableRowSkeleton />;
      }

      if (tab.customContent) {
        return tab.customContent;
      }

      return (
        <ProgressBarList
          data={tab.data}
          onItemClick={onItemClick ? (item) => onItemClick(tab.key, item) : undefined}
          isItemInteractive={isItemInteractive ? (item) => isItemInteractive(tab.key, item) : undefined}
          expandedKeys={expandedKeys}
          onToggleExpand={toggleExpand}
        />
      );
    },
    [onItemClick, isItemInteractive, expandedKeys, toggleExpand],
  );

  const tabsList = useMemo(
    () => (
      <TabsList
        className={`grid grid-cols-${tabs.length} bg-secondary dark:inset-shadow-background relative w-full gap-1 overflow-hidden px-1 inset-shadow-sm`}
      >
        <div
          className='tab-indicator border-border dark:border-input bg-background dark:bg-input/30 pointer-events-none absolute top-[3px] bottom-[3px] left-[4px] z-0 rounded-sm border shadow-sm'
          style={{
            // Width: (container - 2*padding - (n-1)*gap) / n
            width: `calc((100% - 8px - ${(tabs.length - 1) * 4}px) / ${tabs.length})`,
            // index * (one-tab-width + gap)
            transform: `translateX(calc(${activeTabIndex} * (100% + 4px)))`,
          }}
        />

        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className='hover:bg-accent/50 hover:text-foreground text-muted-foreground data-[state=active]:text-foreground relative z-10 cursor-pointer rounded-sm border border-transparent bg-transparent px-3 py-1 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent'
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    ),
    [tabs, activeTabIndex],
  );

  const tabsContent = useMemo(
    () =>
      tabs.map((tab) => (
        <TabsContent key={tab.key} value={tab.key} className='tab-content-animated mt-0'>
          <ScrollArea className='h-[22rem] [&_[data-slot=scroll-area-scrollbar]]:translate-x-2'>
            {renderTabContent(tab)}
          </ScrollArea>
        </TabsContent>
      )),
    [tabs, renderTabContent],
  );

  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:p-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <div className='flex flex-col justify-between space-y-1 px-0 pb-1 sm:flex-row lg:flex-col xl:flex-row xl:items-center'>
          <CardTitle className='flex-1 text-base font-medium'>
            <span className='inline-flex items-center gap-2'>{title}</span>
          </CardTitle>
          <Tabs value={activeTab} onValueChange={handleTabChange} className='flex h-8 items-center sm:items-end'>
            {tabsList}
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col px-0'>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className='relative'>
            {loading && (
              <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <Spinner />
              </div>
            )}
            <div className={cn(loading && 'pointer-events-none opacity-60')}>{tabsContent}</div>
          </div>
        </Tabs>
      </CardContent>
      {footer ? (
        <CardFooter className='justify-end px-0 pt-2'>
          <div className='w-full border-t pt-2 text-right'>{footer}</div>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export default React.memo(MultiProgressTable) as <T extends ProgressBarData>(
  props: MultiProgressTableProps<T>,
) => React.ReactElement;
