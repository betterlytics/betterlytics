import { getServerSession } from 'next-auth';
import WebsiteSetup from './WebsiteSetup';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFirstUserDashboardAction } from '@/app/actions';

export default async function WebsitePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/onboarding/account');
  }

  if (session) {
    const dashboard = await getFirstUserDashboardAction();
    if (dashboard.success && dashboard.data) {
      return redirect('/onboarding/integration');
    }
  }

  return <WebsiteSetup />;
}
