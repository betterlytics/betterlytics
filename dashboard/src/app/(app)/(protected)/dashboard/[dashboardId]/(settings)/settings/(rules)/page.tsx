import { getSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';
import { getCurrentDashboardAction } from '@/app/actions/dashboard/dashboard.action';
import { resolveDashboardContext } from '@/auth/auth-actions';
import RulesSettings from './RulesSettings';

type RulesPageProps = {
  params: Promise<{ dashboardId: string }>;
};

export default async function RulesPage({ params }: RulesPageProps) {
  const { dashboardId } = await params;
  await resolveDashboardContext(dashboardId);

  const siteConfigPromise = getSiteConfigAction(dashboardId);
  const dashboardPromise = getCurrentDashboardAction(dashboardId);

  return <RulesSettings siteConfigPromise={siteConfigPromise} dashboardPromise={dashboardPromise} />;
}
