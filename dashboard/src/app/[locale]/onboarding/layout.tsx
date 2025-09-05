import { OnboardingProvider } from '@/contexts/OnboardingProvider';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { OnboardingProgress } from './OnboardingProgress';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';
import { Suspense } from 'react';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  return (
    <OnboardingProvider>
      <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
        <div className='pointer-events-none static inset-0 overflow-hidden'>
          <div className='absolute top-20 left-10 h-72 w-72 animate-pulse rounded-full bg-blue-500/5 blur-3xl'></div>
          <div className='absolute right-10 bottom-20 h-96 w-96 animate-pulse rounded-full bg-purple-500/5 blur-3xl delay-1000'></div>
          <div className='animate-spin-slow absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-gradient-to-r from-blue-500/3 to-purple-500/3 blur-3xl'></div>
        </div>
        <div className='bg-background'>
          <div className='container mx-auto max-w-4xl px-4 py-6'>
            <Suspense>
              <OnboardingProgress />
            </Suspense>
            <div className='flex min-h-[400px] flex-col justify-center space-y-6'>{children}</div>
          </div>
        </div>
      </PublicEnvironmentVariablesProvider>
    </OnboardingProvider>
  );
}
