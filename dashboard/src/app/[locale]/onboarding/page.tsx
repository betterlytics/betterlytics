import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import Link from 'next/link';
import Logo from '@/components/logo';
import { getFirstUserDashboardAction } from '@/app/actions';

interface OnboardingPageProps {
  searchParams: Promise<{
    onboarding?: string;
  }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await getServerSession(authOptions);

  if (!isFeatureEnabled('enableRegistration')) {
    return (
      <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <div className='mb-6 flex justify-center'>
              <Logo variant='full' width={200} height={60} priority />
            </div>
            <h2 className='text-foreground mt-6 text-2xl font-semibold'>Registration Disabled</h2>
            <p className='text-muted-foreground mt-2 text-sm'>
              Registration is currently disabled on this instance.
            </p>
            <div className='mt-4'>
              <Link href='/signin' className='text-primary hover:text-primary/80 text-sm font-medium underline'>
                Back to Sign In
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
    if (!dashboard) {
      redirect('/onboarding/website');
    } else {
      redirect('/onboarding/integration');
    }
  }

  // For users without a session start at account creation
  redirect('/onboarding/account');
}
