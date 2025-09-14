'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyValueBar } from '@/components/PropertyValueBar';
import { useTranslations } from 'next-intl';

interface ProgressBarData {
  label: string;
  value: number;
  key?: string;
  trendPercentage?: number;
  comparisonValue?: number;
  icon?: React.ReactElement;
}

interface TabConfig<T extends ProgressBarData> {
  key: string;
  label: string;
  data: T[];
  customContent?: React.ReactNode;
}

interface MultiProgressTableProps<T extends ProgressBarData> {
  title: string;
  tabs: TabConfig<T>[];
  defaultTab?: string;
  footer?: React.ReactNode;
}

function MultiProgressTable<T extends ProgressBarData>({
  title,
  tabs,
  defaultTab,
  footer,
}: MultiProgressTableProps<T>) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '');
  const t = useTranslations('dashboard.emptyStates');
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const renderProgressList = useCallback(
    (data: T[]) => {
      const maxVisitors = Math.max(...data.map((item) => item.value), 1);
      const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

      if (data.length === 0) {
        return (
          <div className='flex h-[300px] items-center justify-center'>
            <div className='text-center'>
              <p className='text-muted-foreground mb-1'>{t('noData')}</p>
              <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
            </div>
          </div>
        );
      }

      const someComparison = data.some((row) => row.comparisonValue);

      return (
        <div className='space-y-2'>
          {data.map((item, index) => {
            const relativePercentage = (item.value / maxVisitors) * 100;
            const percentage = (item.value / total) * 100;
            return (
              <div key={item.key ?? item.label} className='group relative'>
                <PropertyValueBar
                  value={{
                    value: item.label,
                    count: item.value,
                    relativePercentage: Math.max(relativePercentage, 2),
                    percentage: percentage,
                    trendPercentage: item.trendPercentage,
                    comparisonValue: item.comparisonValue,
                  }}
                  respectComparison={someComparison}
                  icon={item.icon}
                  index={index + 1}
                />
              </div>
            );
          })}
        </div>
      );
    },
    [t],
  );

  const renderTabContent = useCallback(
    (tab: TabConfig<T>) => {
      if (tab.customContent) {
        return tab.customContent;
      }

      return renderProgressList(tab.data);
    },
    [renderProgressList],
  );

  const tabsList = useMemo(
    () => (
      <TabsList
        className={`grid grid-cols-${tabs.length} bg-secondary dark:inset-shadow-background w-full gap-1 px-0 inset-shadow-sm`}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className='hover:bg-accent text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground cursor-pointer rounded-sm border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:shadow-sm'
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    ),
    [tabs],
  );

  const tabsContent = useMemo(
    () =>
      tabs.map((tab) => (
        <TabsContent key={tab.key} value={tab.key} className='mt-0'>
          {renderTabContent(tab)}
        </TabsContent>
      )),
    [tabs, renderTabContent],
  );

  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:p-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <div className='flex flex-col justify-between space-y-1 px-0 pb-1 sm:flex-row lg:flex-col xl:flex-row xl:items-center'>
          <CardTitle className='flex-1 text-base font-medium'>{title}</CardTitle>
          <Tabs value={activeTab} onValueChange={handleTabChange} className='flex h-8 items-center sm:items-end'>
            {tabsList}
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className='flex-1 px-0'>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {tabsContent}
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
