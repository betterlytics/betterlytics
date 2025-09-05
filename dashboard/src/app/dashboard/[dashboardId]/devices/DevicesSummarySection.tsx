import { use } from 'react';
import { fetchDeviceSummaryAction } from '@/app/actions';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatPercentage } from '@/utils/formatters';
import { DeviceIcon, BrowserIcon, OSIcon } from '@/components/icons';
import { Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';

type DevicesSummarySectionProps = {
  deviceSummaryPromise: ReturnType<typeof fetchDeviceSummaryAction>;
};

export default function DevicesSummarySection({ deviceSummaryPromise }: DevicesSummarySectionProps) {
  const deviceSummary = use(deviceSummaryPromise);
  const t = useTranslations('components.devices.summary');

  const cards: SummaryCardData[] = [
    {
      title: t('distinctDeviceTypes'),
      value: deviceSummary.distinctDeviceCount.toString(),
      icon: <Monitor className='h-4 w-4' />,
    },
    {
      title: t('mostPopularDevice'),
      value: `${deviceSummary.topDevice.name} (${formatPercentage(deviceSummary.topDevice.percentage)})`,
      icon: <DeviceIcon type={deviceSummary.topDevice.name} className='h-4 w-4' />,
    },
    {
      title: t('mostPopularOperatingSystem'),
      value: `${deviceSummary.topOs.name} (${formatPercentage(deviceSummary.topOs.percentage)})`,
      icon: <OSIcon name={deviceSummary.topOs.name} className='h-4 w-4' />,
    },
    {
      title: t('mostPopularBrowser'),
      value: `${deviceSummary.topBrowser.name} (${formatPercentage(deviceSummary.topBrowser.percentage)})`,
      icon: <BrowserIcon name={deviceSummary.topBrowser.name} className='h-4 w-4' />,
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
