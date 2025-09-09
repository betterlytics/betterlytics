'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchDeviceBreakdownCombinedAction } from '@/app/actions/devices';
import { use } from 'react';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { OSIcon } from '@/components/icons/OSIcon';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { ArrowRight } from 'lucide-react';

type DevicesSectionProps = {
  deviceBreakdownCombinedPromise: ReturnType<typeof fetchDeviceBreakdownCombinedAction>;
};

export default function DevicesSection({ deviceBreakdownCombinedPromise }: DevicesSectionProps) {
  const deviceBreakdownCombined = use(deviceBreakdownCombinedPromise);
  const t = useTranslations('dashboard');
  const dashboardId = useDashboardId();

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
        },
      ]}
      footer={
        <FilterPreservingLink
          href={`/dashboard/${dashboardId}/devices`}
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.devices') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
