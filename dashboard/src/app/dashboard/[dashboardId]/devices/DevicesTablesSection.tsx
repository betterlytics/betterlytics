'use client';

import { use } from 'react';
import BrowserTable from '@/components/analytics/BrowserTable';
import OperatingSystemTable from '@/components/analytics/OperatingSystemTable';
import { fetchBrowserBreakdownAction, fetchOperatingSystemBreakdownAction } from '@/app/actions';
import { useTranslations } from 'next-intl';

type DevicesTablesSectionProps = {
  browserStatsPromise: ReturnType<typeof fetchBrowserBreakdownAction>;
  osStatsPromise: ReturnType<typeof fetchOperatingSystemBreakdownAction>;
};

export default function DevicesTablesSection({ browserStatsPromise, osStatsPromise }: DevicesTablesSectionProps) {
  const browserStats = use(browserStatsPromise);
  const osStats = use(osStatsPromise);
  const t = useTranslations('components.devices.tables');

  return (
    <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
      <div className='bg-card border-border rounded-xl border p-6 shadow'>
        <h2 className='text-foreground mb-1 text-lg font-medium'>{t('topOperatingSystems')}</h2>
        <OperatingSystemTable data={osStats} />
      </div>
      <div className='bg-card border-border rounded-xl border p-6 shadow'>
        <h2 className='text-foreground mb-1 text-lg font-medium'>{t('topBrowsers')}</h2>
        <BrowserTable data={browserStats} />
      </div>
    </div>
  );
}
