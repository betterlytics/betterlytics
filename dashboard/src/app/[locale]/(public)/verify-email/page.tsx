import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyEmailAction } from '@/app/actions/auth/verification.action';
import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle } from 'lucide-react';
import { VerificationRedirectHandler } from '@/components/accountVerification/VerificationRedirectHandler';
import { getTranslations } from 'next-intl/server';
import VerifyEmailLoading from './loading';

export async function generateMetadata() {
  return {
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
}

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

async function VerificationResult({ token }: { token: string }) {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('public.auth.verifyEmail');
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
            <h2 className='mb-2 text-xl font-semibold'>{t('failed.title')}</h2>

            {result.error?.includes('expired') ? (
              <div className='bg-muted/50 mt-4 rounded-md p-3'>
                <AlertCircle className='mr-2 inline h-4 w-4' />
                <span className='text-xs'>{t('failed.expiredInfo')}</span>
              </div>
            ) : (
              <p className='mb-4 text-sm'>{result.error || t('failed.genericFallback')}</p>
            )}
          </div>
          <div className='mt-6 space-y-3'>
            {session ? (
              <NextLink href='/dashboards'>
                <Button variant='outline' className='w-full cursor-pointer'>
                  {t('buttons.returnToDashboard')}
                </Button>
              </NextLink>
            ) : (
              <Link href='/signin'>
                <Button variant='outline' className='w-full cursor-pointer'>
                  {t('buttons.backToSignIn')}
                </Button>
              </Link>
            )}
            <p className='text-muted-foreground mt-4 text-xs'>{t('helpLine')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const t = await getTranslations('public.auth.verifyEmail');

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
              <h2 className='mb-2 text-xl font-semibold'>{t('invalid.title')}</h2>
              <p className='text-sm'>{t('invalid.description')}</p>
            </div>
            <div className='mt-6'>
              <Link href='/signin'>
                <Button variant='outline' className='w-full cursor-pointer'>
                  {t('invalid.backToSignIn')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerificationResult token={token} />
    </Suspense>
  );
}
