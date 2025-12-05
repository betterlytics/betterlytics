'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchDeviceBreakdownCombinedAction } from '@/app/actions/analytics/devices';
import { use } from 'react';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { OSIcon } from '@/components/icons/OSIcon';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';

type DevicesSectionProps = {
  deviceBreakdownCombinedPromise: ReturnType<typeof fetchDeviceBreakdownCombinedAction>;
};

export default function DevicesSection({ deviceBreakdownCombinedPromise }: DevicesSectionProps) {
  const deviceBreakdownCombined = use(deviceBreakdownCombinedPromise);
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (tabKey: string, item: { label: string }) => {
    if (tabKey === 'browsers') return makeFilterClick('browser')(item.label);
    if (tabKey === 'devices') return makeFilterClick('device_type')(item.label);
    if (tabKey === 'os') return makeFilterClick('os')(item.label);
  };

  return (
    <MultiProgressTable
      title={t('sections.devicesBreakdown')}
      defaultTab='browsers'
      onItemClick={onItemClick}
      tabs={[
        {
          key: 'browsers',
          label: t('tabs.browsers'),
          data: deviceBreakdownCombined.browsersExpanded.map((item) => ({
            label: item.browser,
            value: item.current.visitors,
            trendPercentage: item.change?.visitors,
            comparisonValue: item.compare?.visitors,
            icon: <BrowserIcon name={item.browser} className='h-4 w-4' />,
            children: item.children?.map((v) => ({
              icon: <BrowserIcon name={item.browser} className='h-4 w-4' />,
              label: `${item.browser} ${v.version}`,
              value: v.current.visitors,
              comparisonValue: v.compare?.visitors,
              trendPercentage: v.change?.visitors,
            })),
          })),
        },
        {
          key: 'os',
          label: t('tabs.operatingSystems'),
          data: deviceBreakdownCombined.operatingSystemsExpanded.map((item) => ({
            label: item.os,
            value: item.current.visitors,
            trendPercentage: item.change?.visitors,
            comparisonValue: item.compare?.visitors,
            icon: <OSIcon name={item.os} className='h-4 w-4' />,
            children: item.children?.map((v) => ({
              icon: <OSIcon name={item.os} className='h-4 w-4' />,
              label: `${item.os} ${v.version}`,
              value: v.current.visitors,
              comparisonValue: v.compare?.visitors,
              trendPercentage: v.change?.visitors,
            })),
          })),
        },
        {
          key: 'devices',
          label: t('tabs.devices'),
          data: deviceBreakdownCombined.devices.map((item) => ({
            label: item.device_type,
            value: item.current.visitors,
            trendPercentage: item.change?.visitors,
            comparisonValue: item.compare?.visitors,
            icon: <DeviceIcon type={item.device_type} className='h-4 w-4' />,
          })),
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
