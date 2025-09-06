import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { Link } from '@/i18n/navigation';
import Logo from '@/components/logo';
import { getFirstUserDashboardAction } from '@/app/actions';
import { getTranslations } from 'next-intl/server';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('onboarding.main');

  if (!isFeatureEnabled('enableRegistration')) {
    return (
      <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <div className='mb-6 flex justify-center'>
              <Logo variant='full' width={200} height={60} priority />
            </div>
            <h2 className='text-foreground mt-6 text-2xl font-semibold'>{t('registrationDisabled.title')}</h2>
            <p className='text-muted-foreground mt-2 text-sm'>
              {t('registrationDisabled.description')}
            </p>
            <div className='mt-4'>
              <Link href='/signin' className='text-primary hover:text-primary/80 text-sm font-medium underline'>
                {t('registrationDisabled.backToSignIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user has a session (such as going back or OAuth users):
  // - If they don't have a dashboard, go to website step
  // - If they have a dashboard, go to integration step
  if (session) {
    const dashboard = await getFirstUserDashboardAction();
    if (dashboard.success && dashboard.data) {
      return redirect('/onboarding/integration');
    } else {
      return redirect('/onboarding/website');
    }
  }

  // For users without a session start at account creation
  return redirect('/onboarding/account');
}
