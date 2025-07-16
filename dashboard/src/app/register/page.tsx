import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import RegisterForm from '@/app/register/RegisterForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboards');
  }

  if (!isFeatureEnabled('enableRegistration')) {
    return (
      <div className='bg-background flex w-full items-center justify-center px-4 sm:px-6 lg:px-8'>
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

  return (
    <div className='bg-background flex min-h-screen w-full items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>Create your account</h2>
          <p className='text-muted-foreground mt-2 text-sm'>Start tracking your analytics today</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>
          <RegisterForm />
          <div className='mt-6 text-center'>
            <p className='text-muted-foreground text-sm'>
              Already have an account?{' '}
              <Link href='/signin' className='text-primary hover:text-primary/80 font-medium underline'>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
