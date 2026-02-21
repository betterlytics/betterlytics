import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import IntegrationsSettings from './IntegrationsSettings';

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ dashboardId: string }>;
}) {
  if (!isFeatureEnabled('enableIntegrations')) {
    notFound();
  }

  return <IntegrationsSettings />;
}
