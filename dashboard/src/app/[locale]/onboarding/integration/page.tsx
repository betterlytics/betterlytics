import { getServerSession } from 'next-auth';
import Integration from './Integration';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFirstUserDashboardAction } from '@/app/actions';

export default async function IntegrationPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/onboarding/account');
  }

  if (session) {
    const dashboard = await getFirstUserDashboardAction();
    if (dashboard.success && dashboard.data === null) {
      return redirect('/onboarding/website');
    }
  }

  return <Integration />;
}
