import { redirect } from 'next/navigation';
import { requireAuth } from '@/auth/auth-actions';
import TimezoneCookieInitializer from './TimezoneCookieInitializer';
import UserThemeInitializer from './UserThemeInitializer';
import { isUserInvitedDashboardMemberAction } from '@/app/actions/index.actions';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  if (!session.user.onboardingCompletedAt) {
    const userInvited = await isUserInvitedDashboardMemberAction();
    if (!userInvited.success || !userInvited.data) {
      redirect('/onboarding');
    }
  }

  return (
    <>
      <TimezoneCookieInitializer />
      <UserThemeInitializer theme={session.user.settings?.theme} />
      {children}
    </>
  );
}
