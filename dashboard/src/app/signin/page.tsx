import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  const registrationEnabled = isFeatureEnabled('enableRegistration');

  if (session) {
    redirect('/dashboards');
  }

  return (
    <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>Sign in to your account</h2>
          <p className='text-muted-foreground mt-2 text-sm'>Access your analytics dashboard</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>
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
