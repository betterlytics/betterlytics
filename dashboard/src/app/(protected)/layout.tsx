import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TimezoneCookieInitializer from './TimezoneCookieInitializer';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/signin');
  }

  if (!session.user.onboardingCompletedAt) {
    redirect('/onboarding');
  }

  return (
    <>
      <TimezoneCookieInitializer />
      {children}
    </>
  );
}
