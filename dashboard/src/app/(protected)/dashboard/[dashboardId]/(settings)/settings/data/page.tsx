import { getSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import DataSettings from './DataSettings';

type DataPageProps = {
  params: Promise<{ dashboardId: string }>;
};

export default async function DataPage({ params }: DataPageProps) {
  const { dashboardId } = await params;
  const siteConfigPromise = getSiteConfigAction(dashboardId);

  return <DataSettings siteConfigPromise={siteConfigPromise} />;
}
