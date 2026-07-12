'use client';
import MultiProgressTable, { type ProgressBarData } from '@/components/MultiProgressTable';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { OSIcon } from '@/components/icons/OSIcon';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useProgressTableFilterClick } from '@/hooks/use-progress-table-filter-click';
import { useState } from 'react';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';

export default function DevicesSection() {
  const [activeTab, setActiveTab] = useState('browsers');
  const t = useTranslations('dashboard');
  const { onItemClick, isItemInteractive } = useProgressTableFilterClick();
  const { input, options } = useBAQueryParams();

  const browsersQuery = trpc.devices.browserRollup.useQuery(input, {
    ...options,
    enabled: activeTab === 'browsers',
  });
  const osQuery = trpc.devices.osRollup.useQuery(input, { ...options, enabled: activeTab === 'os' });
  const devicesQuery = trpc.devices.deviceType.useQuery(input, { ...options, enabled: activeTab === 'devices' });

  const browsersState = useQueryState(browsersQuery, activeTab === 'browsers');
  const osState = useQueryState(osQuery, activeTab === 'os');
  const devicesState = useQueryState(devicesQuery, activeTab === 'devices');
  const activeState = { browsers: browsersState, os: osState, devices: devicesState }[
    activeTab as 'browsers' | 'os' | 'devices'
  ];

  return (
    <MultiProgressTable
      title={t('sections.devicesBreakdown')}
      loading={activeState.refetching}
      defaultTab='browsers'
      onTabChange={setActiveTab}
      onItemClick={onItemClick}
      isItemInteractive={isItemInteractive}
      tabs={[
        {
          key: 'browsers',
          label: t('tabs.browsers'),
          loading: browsersState.loading,
          data: (browsersQuery.data ?? []).map(
            (item): ProgressBarData => ({
              label: item.browser,
              value: item.current.visitors,
              trendPercentage: item.change?.visitors,
              comparisonValue: item.compare?.visitors,
              filterColumn: 'browser',
              icon: <BrowserIcon name={item.browser} className='h-4 w-4' />,
              children: item.children?.map(
                (v): ProgressBarData => ({
                  filterColumn: 'browser',
                  filterValue: item.browser,
                  icon: <BrowserIcon name={item.browser} className='h-4 w-4' />,
                  label: `${item.browser} ${v.version}`,
                  value: v.current.visitors,
                  comparisonValue: v.compare?.visitors,
                  trendPercentage: v.change?.visitors,
                }),
              ),
            }),
          ),
        },
        {
          key: 'os',
          label: t('tabs.operatingSystems'),
          loading: osState.loading,
          data: (osQuery.data ?? []).map(
            (item): ProgressBarData => ({
              label: item.os,
              value: item.current.visitors,
              trendPercentage: item.change?.visitors,
              comparisonValue: item.compare?.visitors,
              filterColumn: 'os',
              icon: <OSIcon name={item.os} className='h-4 w-4' />,
              children: item.children?.map(
                (v): ProgressBarData => ({
                  filterColumn: 'os',
                  filterValue: item.os,
                  icon: <OSIcon name={item.os} className='h-4 w-4' />,
                  label: `${item.os} ${v.version}`,
                  value: v.current.visitors,
                  comparisonValue: v.compare?.visitors,
                  trendPercentage: v.change?.visitors,
                }),
              ),
            }),
          ),
        },
        {
          key: 'devices',
          label: t('tabs.devices'),
          loading: devicesState.loading,
          data: (devicesQuery.data ?? []).map(
            (item): ProgressBarData => ({
              label: item.device_type,
              value: item.current.visitors,
              trendPercentage: item.change?.visitors,
              comparisonValue: item.compare?.visitors,
              filterColumn: 'device_type',
              icon: <DeviceIcon type={item.device_type} className='h-4 w-4' />,
            }),
          ),
        },
      ]}
      footer={
        <FilterPreservingLink
          href='devices'
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.devices') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
