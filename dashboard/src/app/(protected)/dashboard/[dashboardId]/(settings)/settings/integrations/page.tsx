import {
  getAvailableIntegrationTypesAction,
  getIntegrationsAction,
} from '@/app/actions/dashboard/integrations.action';
import IntegrationsSettings from './IntegrationsSettings';

type IntegrationsPageProps = {
  params: Promise<{ dashboardId: string }>;
};

export default async function IntegrationsPage({ params }: IntegrationsPageProps) {
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
