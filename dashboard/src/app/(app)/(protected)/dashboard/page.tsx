import { redirect } from 'next/navigation';
import { getSoleUserDashboardAction } from '@/app/actions/index.actions';

export default async function DashboardPage() {
  const dashboard = await getSoleUserDashboardAction();

  if (!dashboard.success || dashboard.data === null) {
    redirect(`/dashboards`);
  }

  redirect(`/dashboard/${dashboard.data.id}`);
}
