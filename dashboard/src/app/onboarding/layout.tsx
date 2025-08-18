import { OnboardingProvider } from '@/contexts/OnboardingProvider';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { OnboardingProgress } from './OnboardingProgress';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  return (
    <OnboardingProvider>
      <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
        <div className='bg-background'>
          <div className='container mx-auto max-w-2xl px-4 py-12'>
            <OnboardingProgress />
            <div className='bg-card rounded-lg border p-8 shadow-sm'>
              <div className='min-h-[400px] space-y-6'>
                {children}
              </div>
            </div>
          </div>
        </div>
      </PublicEnvironmentVariablesProvider>
    </OnboardingProvider>
  );
}