import { redirect } from 'next/navigation';
import { requireAuth } from '@/auth/auth-actions';
import TimezoneCookieInitializer from './TimezoneCookieInitializer';
import UserThemeInitializer from './UserThemeInitializer';
import { isUserInvitedDashboardMemberAction } from '@/app/actions/index.actions';
import { env } from '@/lib/env';
import { DevWidget } from '@/components/dev/DevWidget';
import { getUserSubscription } from '@/repositories/postgres/subscription.repository';
import { getUserSettings } from '@/services/account/userSettings.service';
import { UserSettingsProvider } from '@/contexts/UserSettingsProvider';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  if (!session.user.onboardingCompletedAt) {
    const userInvited = await isUserInvitedDashboardMemberAction();
    if (!userInvited.success || !userInvited.data) {
      redirect('/onboarding');
    }
  }

  const initialSettings = await getUserSettings(session.user.id);

  return (
    <UserSettingsProvider initialSettings={initialSettings}>
      <TimezoneCookieInitializer />
      <UserThemeInitializer theme={initialSettings.theme} />
      {children}
      {env.IS_DEVELOPMENT && <DevWidgetLoader userId={session.user.id} />}
    </UserSettingsProvider>
  );
}

async function DevWidgetLoader({ userId }: { userId: string }) {
  const subscription = await getUserSubscription(userId);
  return <DevWidget initialTier={subscription?.tier ?? 'growth'} />;
}
