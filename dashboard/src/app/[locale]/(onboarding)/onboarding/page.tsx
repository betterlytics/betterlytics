import { isFeatureEnabled } from '@/lib/feature-flags';
import { Link } from '@/i18n/navigation';
import Logo from '@/components/logo';
import { getFirstUserDashboardAction } from '@/app/actions';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { getProviders } from 'next-auth/react';
import OnboardingPage from './OnboardingPage';
import { OnboardingProvider } from './OnboardingProvider';
import { SupportedLanguages } from '@/constants/i18n';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth/auth-actions';

export default async function Onboarding() {
  const session = await getAuthSession();
  const t = await getTranslations('onboarding.main');

  if (!isFeatureEnabled('enableRegistration')) {
    const seoConfig = await buildSEOConfig(SEO_CONFIGS.onboarding);
    return (
      <>
        <StructuredData config={seoConfig} />
        <div className='bg-background flex items-center justify-center px-4 py-12 pt-20 sm:px-6 lg:px-8'>
          <div className='w-full max-w-md space-y-8'>
            <div className='text-center'>
              <div className='mb-6 flex justify-center'>
                <Logo variant='full' width={200} height={60} priority />
              </div>
              <h2 className='text-foreground mt-6 text-2xl font-semibold'>{t('registrationDisabled.title')}</h2>
              <p className='text-muted-foreground mt-2 text-sm'>{t('registrationDisabled.description')}</p>
              <div className='mt-4'>
                <Link href='/signin' className='text-primary hover:text-primary/80 text-sm font-medium underline'>
                  {t('registrationDisabled.backToSignIn')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const getFirstDashboard = async () => {
    if (session) {
      const dashboard = await getFirstUserDashboardAction();
      if (dashboard.success && dashboard.data) {
        return dashboard.data;
      }
    }

    return null;
  };

  const dashboard = await getFirstDashboard();

  const getStep = async () => {
    if (!session) {
      return 'account';
    }

    if (!dashboard) {
      return 'website';
    }

    if (session.user.onboardingCompletedAt) {
      redirect('/dashboards');
    }

    return 'integration';
  };

  const providers = await getProviders();
  const initialStep = await getStep();

  const seoConfig = await buildSEOConfig(SEO_CONFIGS.onboarding);

  return (
    <>
      <StructuredData config={seoConfig} />
      <OnboardingProvider initialDashboard={dashboard}>
        <OnboardingPage initialStep={initialStep} providers={providers} />
      </OnboardingProvider>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: SupportedLanguages }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.onboarding);
  return generateSEO(seoConfig, {
    locale,
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
  });
}
