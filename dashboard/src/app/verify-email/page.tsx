import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyEmailAction } from '@/app/actions/verification';
import Logo from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle } from 'lucide-react';
import { VerificationRedirectHandler } from '@/components/accountVerification/VerificationRedirectHandler';

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const session = await getServerSession(authOptions);
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <div className='mb-6 flex justify-center'>
              <Logo variant='full' width={200} height={60} priority />
            </div>
            <div className='bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-6'>
              <XCircle className='mx-auto mb-4 h-12 w-12' />
              <h2 className='mb-2 text-xl font-semibold'>Invalid Verification Link</h2>
              <p className='text-sm'>
                The verification link is invalid or missing. Please check your email and try again.
              </p>
            </div>
            <div className='mt-6'>
              <Link href='/signin'>
                <Button variant='outline' className='w-full'>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const result = await verifyEmailAction({ token });

  if (result.success) {
    return <VerificationRedirectHandler hasSession={!!session} />;
  }

  return (
    <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <div className='bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-6'>
            <XCircle className='mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-xl font-semibold'>Verification Failed</h2>

            {result.error?.includes('expired') ? (
              <div className='bg-muted/50 mt-4 rounded-md p-3'>
                <AlertCircle className='mr-2 inline h-4 w-4' />
                <span className='text-xs'>
                  Verification links expire after 24 hours for security. You can request a new one and try again.
                </span>
              </div>
            ) : (
              <p className='mb-4 text-sm'>{result.error || 'An error occurred during verification.'}</p>
            )}
          </div>
          <div className='mt-6 space-y-3'>
            {session ? (
              <Link href='/dashboards'>
                <Button variant='outline' className='w-full'>
                  Return to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href='/signin'>
                <Button variant='outline' className='w-full'>
                  Back to Sign In
                </Button>
              </Link>
            )}
            <p className='text-muted-foreground mt-4 text-xs'>
              Need help? Contact support at support@betterlytics.io
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
