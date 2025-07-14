'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchDeviceBreakdownCombinedAction } from '@/app/actions/devices';
import { use } from 'react';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { OSIcon } from '@/components/icons/OSIcon';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type DevicesSectionProps = {
  deviceBreakdownCombinedPromise: ReturnType<typeof fetchDeviceBreakdownCombinedAction>;
};

export default function DevicesSection({ deviceBreakdownCombinedPromise }: DevicesSectionProps) {
  const deviceBreakdownCombined = use(deviceBreakdownCombinedPromise);
  const { dictionary } = useDictionary();

  return (
    <MultiProgressTable
      title={dictionary.t('dashboard.sections.devicesBreakdown')}
      defaultTab='browsers'
      tabs={[
        {
          key: 'browsers',
          label: dictionary.t('dashboard.tabs.browsers'),
          data: deviceBreakdownCombined.browsers.map((item) => ({
            label: item.browser,
            value: item.visitors,
            icon: <BrowserIcon name={item.browser} className='h-4 w-4' />,
          })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noBrowserData'),
        },
        {
          key: 'devices',
          label: dictionary.t('dashboard.tabs.devices'),
          data: deviceBreakdownCombined.devices.map((item) => ({
            label: item.device_type,
            value: item.visitors,
            icon: <DeviceIcon type={item.device_type} className='h-4 w-4' />,
          })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noDeviceData'),
        },
        {
          key: 'os',
          label: dictionary.t('dashboard.tabs.operatingSystems'),
          data: deviceBreakdownCombined.operatingSystems.map((item) => ({
            label: item.os,
            value: item.visitors,
            icon: <OSIcon name={item.os} className='h-4 w-4' />,
          })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noOperatingSystemData'),
        },
      ]}
    />
  );
}
