'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchDeviceBreakdownCombinedAction } from '@/app/actions/devices';
import { use } from 'react';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { OSIcon } from '@/components/icons/OSIcon';
import { useTranslations } from 'next-intl';

type DevicesSectionProps = {
  deviceBreakdownCombinedPromise: ReturnType<typeof fetchDeviceBreakdownCombinedAction>;
};

export default function DevicesSection({ deviceBreakdownCombinedPromise }: DevicesSectionProps) {
  const deviceBreakdownCombined = use(deviceBreakdownCombinedPromise);
  const t = useTranslations('dashboard');

  return (
    <MultiProgressTable
      title={t('sections.devicesBreakdown')}
      defaultTab='browsers'
      tabs={[
        {
          key: 'browsers',
          label: t('tabs.browsers'),
          data: deviceBreakdownCombined.browsers.map((item) => ({
            label: item.browser,
            value: item.current.visitors,
            trendPercentage: item.change?.visitors,
            comparisonValue: item.compare?.visitors,
            icon: <BrowserIcon name={item.browser} className='h-4 w-4' />,
          })),
          emptyMessage: t('emptyStates.noBrowserData'),
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
          emptyMessage: t('emptyStates.noDeviceData'),
        },
        {
          key: 'os',
          label: t('tabs.operatingSystems'),
          data: deviceBreakdownCombined.operatingSystems.map((item) => ({
            label: item.os,
            value: item.current.visitors,
            trendPercentage: item.change?.visitors,
            comparisonValue: item.compare?.visitors,
            icon: <OSIcon name={item.os} className='h-4 w-4' />,
          })),
          emptyMessage: t('emptyStates.noOperatingSystemData'),
        },
      ]}
    />
  );
}
