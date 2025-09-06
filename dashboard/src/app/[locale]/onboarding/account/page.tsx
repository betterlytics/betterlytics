import { getServerSession } from 'next-auth';
import AccountCreation from './AccountCreation';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFirstUserDashboardAction } from '@/app/actions';
import { getProviders } from 'next-auth/react';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const dashboard = await getFirstUserDashboardAction();
    if (dashboard.success && dashboard.data) {
      return redirect('/onboarding/integration');
    } else {
      return redirect('/onboarding/website');
    }
  }

  const providers = await getProviders();

  return <AccountCreation providers={providers} />;
}
