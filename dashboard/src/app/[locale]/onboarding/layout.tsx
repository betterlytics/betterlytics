import { OnboardingProvider } from '@/contexts/OnboardingProvider';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  return (
    <div className='bg-background absolute top-0 left-0 z-[1000] h-svh max-h-dvh w-svw max-w-dvw overflow-x-hidden overflow-y-auto'>
      <div className='bg-background relative my-auto h-auto w-full'>
        <OnboardingProvider>
          <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
            <div className='pointer-events-none static inset-0 overflow-hidden'>
              <div className='absolute top-20 left-10 h-72 w-72 animate-pulse rounded-full bg-blue-500/5 blur-3xl'></div>
              <div className='absolute right-10 bottom-20 h-96 w-96 animate-pulse rounded-full bg-purple-500/5 blur-3xl delay-1000'></div>
              <div className='animate-spin-slow absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-gradient-to-r from-blue-500/3 to-purple-500/3 blur-3xl'></div>
            </div>
            <div className='flex h-full w-full flex-col items-center justify-center'>
              <div className='container mx-auto flex h-full max-w-4xl flex-col px-4'>{children}</div>
            </div>
          </PublicEnvironmentVariablesProvider>
        </OnboardingProvider>
      </div>
    </div>
  );
}
