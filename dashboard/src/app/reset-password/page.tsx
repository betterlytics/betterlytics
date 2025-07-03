import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { validateResetTokenAction } from '@/app/actions/passwordReset';

interface ResetPasswordPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboards');
  }

  const { token } = await searchParams;

  if (!token) {
    return (
      <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <div className='mb-6 flex justify-center'>
              <Logo variant='full' width={200} height={60} priority />
            </div>
            <h2 className='text-foreground mt-6 text-2xl font-semibold'>Invalid Reset Link</h2>
            <p className='text-muted-foreground mt-2 text-sm'>
              This password reset link is invalid or missing a token.
            </p>
          </div>
          <div className='bg-card rounded-lg border p-8 text-center shadow-sm'>
            <p className='text-muted-foreground mb-4 text-sm'>Please request a new password reset link.</p>
            <Link href='/forgot-password' className='text-primary hover:text-primary/80 font-medium underline'>
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isValidToken = await validateResetTokenAction(token);

  if (!isValidToken) {
    return (
      <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <div className='mb-6 flex justify-center'>
              <Logo variant='full' width={200} height={60} priority />
            </div>
            <h2 className='text-foreground mt-6 text-2xl font-semibold'>Reset Link Expired</h2>
            <p className='text-muted-foreground mt-2 text-sm'>
              This password reset link has expired or is invalid.
            </p>
          </div>
          <div className='bg-card rounded-lg border p-8 text-center shadow-sm'>
            <p className='text-muted-foreground mb-4 text-sm'>
              Password reset links expire after 1 hour for security reasons. Please request a new one.
            </p>
            <Link href='/forgot-password' className='text-primary hover:text-primary/80 font-medium underline'>
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>Set your new password</h2>
          <p className='text-muted-foreground mt-2 text-sm'>Enter your new password below</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>
          <ResetPasswordForm token={token} />
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
