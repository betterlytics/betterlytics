import {
  getAvailableIntegrationTypesAction,
  getIntegrationsAction,
} from '@/app/actions/dashboard/integrations.action';
import { isFeatureEnabled } from '@/lib/feature-flags';
import IntegrationsSettings from './IntegrationsSettings';

type IntegrationsPageProps = {
  params: Promise<{ dashboardId: string }>;
};

export default async function IntegrationsPage({ params }: IntegrationsPageProps) {
  const { dashboardId } = await params;
  const availableTypesPromise = getAvailableIntegrationTypesAction(dashboardId);
  const integrationsPromise = getIntegrationsAction(dashboardId);
  // Integrations are only ever triggered by uptime monitoring, so without it nothing will be delivered
  const monitoringEnabled = isFeatureEnabled('enableUptimeMonitoring');

  return (
    <IntegrationsSettings
      availableTypesPromise={availableTypesPromise}
      integrationsPromise={integrationsPromise}
      monitoringEnabled={monitoringEnabled}
    />
  );
}
