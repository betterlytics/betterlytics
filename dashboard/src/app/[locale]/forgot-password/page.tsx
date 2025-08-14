import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import { Link } from '@/i18n/navigation';

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);

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
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>Reset your password</h2>
          <p className='text-muted-foreground mt-2 text-sm'>
            Enter your email and we'll send you a password reset link
          </p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>
          <ForgotPasswordForm />
          <div className='mt-6 text-center'>
            <p className='text-muted-foreground text-sm'>
              Remember your password?{' '}
              <Link href='/signin' className='text-primary hover:text-primary/80 font-medium underline'>
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
