import { redirect } from 'next/navigation';
import { getFirstUserDashboardAction } from '@/app/actions/index.action';

export default async function DashboardPage() {
  const dashboard = await getFirstUserDashboardAction();

  if (!dashboard.success || dashboard.data === null) {
    redirect(`/dashboards`);
  }

  redirect(`/dashboard/${dashboard.data.id}`);
}
