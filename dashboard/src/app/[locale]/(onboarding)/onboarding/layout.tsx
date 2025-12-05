import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions/index.action';
import { OnboardingFooter } from '@/components/footer/OnboardingFooter';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  return (
    <div className='bg-background min-h-svh w-full overflow-x-hidden'>
      <div className='bg-background relative my-auto h-auto w-full'>
        <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
          <div className='pointer-events-none static inset-0 overflow-hidden'>
            <div className='absolute top-20 left-10 h-72 w-72 animate-pulse rounded-full bg-blue-500/5 blur-3xl'></div>
            <div className='absolute right-10 bottom-20 h-96 w-96 animate-pulse rounded-full bg-purple-500/5 blur-3xl delay-1000'></div>
            <div className='animate-spin-slow absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-gradient-to-r from-blue-500/3 to-purple-500/3 blur-3xl'></div>
          </div>
          <div className='flex min-h-svh w-full flex-col items-center'>
            <div className='container mx-auto flex w-full max-w-4xl flex-1 flex-col px-4'>
              <div className='mb-6 flex flex-1 flex-col'>{children}</div>
              <OnboardingFooter />
            </div>
          </div>
        </PublicEnvironmentVariablesProvider>
      </div>
    </div>
  );
}
