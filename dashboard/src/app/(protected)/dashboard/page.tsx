import { redirect } from 'next/navigation';
import { getFirstUserDashboardAction } from '../../actions/dashboard';

export default async function DashboardPage() {
  const dashboard = await getFirstUserDashboardAction();

  if (!dashboard.success || dashboard.data === null) {
    redirect(`/dashboards`);
  }

  redirect(`/dashboard/${dashboard.data.id}`);
}
