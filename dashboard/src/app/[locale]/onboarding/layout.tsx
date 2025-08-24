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
          <div className='container mx-auto max-w-4xl px-4 py-12'>
            <OnboardingProgress />
            <div className='min-h-[400px] space-y-6'>{children}</div>
          </div>
        </div>
      </PublicEnvironmentVariablesProvider>
    </OnboardingProvider>
  );
}
