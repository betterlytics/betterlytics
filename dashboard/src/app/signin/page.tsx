import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { VerificationSuccessHandler } from '@/components/accountVerification/VerificationSuccessHandler';

interface SignInPageProps {
  searchParams: Promise<{
    error?: string;
    callbackUrl?: string;
    verified?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerSession(getAuthOptions());
  const registrationEnabled = isFeatureEnabled('enableRegistration');
  const { error } = await searchParams;

  if (session) {
    redirect('/dashboards');
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please check your credentials and try again.';
      default:
        return 'An error occurred during sign in. Please try again.';
    }
  };

  return (
    <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <VerificationSuccessHandler />

      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>Sign in to your account</h2>
          <p className='text-muted-foreground mt-2 text-sm'>Access your analytics dashboard</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>
          {error && (
            <div
              className='bg-destructive/10 border-destructive/20 text-destructive mb-6 rounded-md border px-4 py-3'
              role='alert'
            >
              <span className='block sm:inline'>{getErrorMessage(error)}</span>
            </div>
          )}
          <LoginForm />
          {registrationEnabled && (
            <div className='mt-6 text-center'>
              <p className='text-muted-foreground text-sm'>
                Don&apos;t have an account?{' '}
                <Link href='/register' className='text-primary hover:text-primary/80 font-medium underline'>
                  Create one
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
