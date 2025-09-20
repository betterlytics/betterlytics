import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';
import { authOptions } from '@/lib/auth';
import RegisterForm from '@/app/[locale]/(public)/register/RegisterForm';
import Logo from '@/components/logo';
import { getServerSession } from 'next-auth';
import { Link } from '@/i18n/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  ...generateSEO({
    title: 'Get started for free — Create your Betterlytics account',
    description:
      'Get started for free with Betterlytics. Create your account for privacy-first, cookieless analytics for websites and apps.',
    keywords: [
      'Register',
      'Create Account',
      'Sign up',
      'Betterlytics',
      'Web Analytics',
      'Google Analytics Alternative',
    ],
    path: '/register',
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

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('public.auth.register');

  if (session) {
    redirect('/dashboards');
  }

  if (!isFeatureEnabled('enableRegistration')) {
    return (
      <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <div className='mb-6 flex justify-center'>
              <Logo variant='full' width={200} height={60} priority />
            </div>
            <h2 className='text-foreground mt-6 text-2xl font-semibold'>{t('disabled.title')}</h2>
            <p className='text-muted-foreground mt-2 text-sm'>{t('disabled.description')}</p>
            <div className='mt-4'>
              <Link href='/signin' className='text-primary hover:text-primary/80 text-sm font-medium underline'>
                {t('disabled.backToSignIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to new onboarding flow
  redirect('/onboarding');

  return (
    <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>
          <h2 className='text-foreground mt-6 text-2xl font-semibold'>{t('title')}</h2>
          <p className='text-muted-foreground mt-2 text-sm'>{t('subtitle')}</p>
        </div>
        <div className='bg-card rounded-lg border p-8 shadow-sm'>
          <RegisterForm />
          <div className='mt-6 text-center'>
            <p className='text-muted-foreground text-sm'>
              {t('cta.haveAccount')}{' '}
              <Link href='/signin' className='text-primary hover:text-primary/80 font-medium underline'>
                {t('cta.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
