import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';
import { authOptions } from '@/lib/auth';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { validateResetTokenAction } from '@/app/actions/passwordReset';

export const metadata: Metadata = {
  ...generateSEO({
    title: 'Reset your password | Betterlytics',
    description: 'Set a new password for your Betterlytics account using your secure reset link.',
    keywords: ['Reset Password', 'Password Reset', 'Account Recovery', 'Betterlytics'],
    path: '/reset-password',
  }),
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-image-preview': 'none',
      'max-snippet': 0,
      'max-video-preview': 0,
    },
  },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

interface ResetPasswordLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function ResetPasswordLayout({ title, description, children }: ResetPasswordLayoutProps) {
  return (
    <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>{title}</h2>
          <p className='text-muted-foreground mt-2 text-sm'>{description}</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>{children}</div>
      </div>
    </div>
  );
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboards');
  }

  const { token } = await searchParams;

  if (!token) {
    return (
      <ResetPasswordLayout
        title='Invalid Reset Link'
        description='This password reset link is invalid or missing a token.'
      >
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>Please request a new password reset link.</p>
          <Link href='/forgot-password' className='text-primary hover:text-primary/80 font-medium underline'>
            Request New Reset Link
          </Link>
        </div>
      </ResetPasswordLayout>
    );
  }

  const isValidToken = await validateResetTokenAction(token);

  if (!isValidToken) {
    return (
      <ResetPasswordLayout
        title='Reset Link Expired'
        description='This password reset link has expired or is invalid.'
      >
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>
            Password reset links expire after 1 hour for security reasons. Please request a new one.
          </p>
          <Link href='/forgot-password' className='text-primary hover:text-primary/80 font-medium underline'>
            Request New Reset Link
          </Link>
        </div>
      </ResetPasswordLayout>
    );
  }

  return (
    <ResetPasswordLayout title='Set your new password' description='Enter your new password below'>
      <ResetPasswordForm token={token} />
      <div className='mt-6 text-center'>
        <p className='text-muted-foreground text-sm'>
          Remember your password?{' '}
          <Link href='/signin' className='text-primary hover:text-primary/80 font-medium underline'>
            Back to Sign In
          </Link>
        </p>
      </div>
    </ResetPasswordLayout>
  );
}
