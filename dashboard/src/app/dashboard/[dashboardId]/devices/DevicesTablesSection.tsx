'use client';

import { use } from 'react';
import BrowserTable from '@/components/analytics/BrowserTable';
import OperatingSystemTable from '@/components/analytics/OperatingSystemTable';
import { fetchBrowserBreakdownAction, fetchOperatingSystemBreakdownAction } from '@/app/actions';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type DevicesTablesSectionProps = {
  browserStatsPromise: ReturnType<typeof fetchBrowserBreakdownAction>;
  osStatsPromise: ReturnType<typeof fetchOperatingSystemBreakdownAction>;
};

export default function DevicesTablesSection({ browserStatsPromise, osStatsPromise }: DevicesTablesSectionProps) {
  const browserStats = use(browserStatsPromise);
  const osStats = use(osStatsPromise);
  const { dictionary } = useDictionary();

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <div className='bg-card border-border rounded-lg border p-6 shadow'>
        <h2 className='text-foreground mb-1 text-lg font-bold'>{dictionary.t('components.devices.tables.topOperatingSystems')}</h2>
        <p className='text-muted-foreground mb-4 text-sm'>{dictionary.t('components.devices.tables.mostCommonOperatingSystems')}</p>
        <OperatingSystemTable data={osStats} />
      </div>
      <div className='bg-card border-border rounded-lg border p-6 shadow'>
        <h2 className='text-foreground mb-1 text-lg font-bold'>{dictionary.t('components.devices.tables.topBrowsers')}</h2>
        <p className='text-muted-foreground mb-4 text-sm'>{dictionary.t('components.devices.tables.mostCommonBrowsers')}</p>
        <BrowserTable data={browserStats} />
      </div>
    </div>
  );
}
