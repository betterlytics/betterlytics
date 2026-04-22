import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { MonitoringClient } from './MonitoringClient';

export default function MonitoringPage() {
  if (!isFeatureEnabled('enableUptimeMonitoring')) {
    notFound();
  }

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <MonitoringClient />
    </div>
  );
}
