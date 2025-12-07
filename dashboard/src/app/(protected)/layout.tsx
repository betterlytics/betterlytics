import { redirect } from 'next/navigation';
import { requireAuth } from '@/auth/auth-actions';
import TimezoneCookieInitializer from './TimezoneCookieInitializer';
import UserThemeInitializer from './UserThemeInitializer';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  if (!session.user.onboardingCompletedAt) {
    redirect('/onboarding');
  }

  return (
    <>
      <TimezoneCookieInitializer />
      <UserThemeInitializer />
      {children}
    </>
  );
}
