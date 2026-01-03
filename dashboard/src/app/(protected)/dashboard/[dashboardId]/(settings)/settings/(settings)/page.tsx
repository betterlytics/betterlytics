import { getSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import DataSettings from './DataSettings';
import { Suspense } from 'react';

type SettingsPageProps = {
  params: Promise<{ dashboardId: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { dashboardId } = await params;
  const config = getSiteConfigAction(dashboardId);

  return (
    <Suspense>
      <DataSettings siteConfigPromise={config} />
    </Suspense>
  );
}
