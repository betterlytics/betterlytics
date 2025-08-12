import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LandingPage from './(landing)/landingPage';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';

export default async function HomePage() {
  if (!isClientFeatureEnabled('isCloud')) {
    const session = await getServerSession(authOptions);

    if (session) {
      redirect('/dashboards');
    } else {
      redirect('/signin');
    }
  }

  return <LandingPage />;
}
