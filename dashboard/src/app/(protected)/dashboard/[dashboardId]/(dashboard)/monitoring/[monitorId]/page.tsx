import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { MonitorDetailClient } from './MonitorDetailClient';

type MonitorDetailParams = {
  params: Promise<{ monitorId: string }>;
};

export default async function MonitorDetailPage({ params }: MonitorDetailParams) {
  if (!isFeatureEnabled('enableUptimeMonitoring')) {
    notFound();
  }

  const { monitorId } = await params;

  return <MonitorDetailClient monitorId={monitorId} />;
}
