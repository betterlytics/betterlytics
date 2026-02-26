import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import {
  getAvailableIntegrationTypesAction,
  getIntegrationsAction,
} from '@/app/actions/dashboard/integrations.action';
import IntegrationsSettings from './IntegrationsSettings';

type IntegrationsPageProps = {
  params: Promise<{ dashboardId: string }>;
};

export default async function IntegrationsPage({ params }: IntegrationsPageProps) {
  if (!isFeatureEnabled('enableIntegrations')) {
    notFound();
  }

  const { dashboardId } = await params;
  const availableTypesPromise = getAvailableIntegrationTypesAction(dashboardId);
  const integrationsPromise = getIntegrationsAction(dashboardId);

  return (
    <IntegrationsSettings
      availableTypesPromise={availableTypesPromise}
      integrationsPromise={integrationsPromise}
    />
  );
}
