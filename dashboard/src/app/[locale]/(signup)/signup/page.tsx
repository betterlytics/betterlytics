import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import type { SupportedLanguages } from '@/constants/i18n';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getTranslations } from 'next-intl/server';
import { StructuredData } from '@/components/StructuredData';
import { getAuthSession } from '@/auth/auth-actions';
import { getProviders } from 'next-auth/react';
import SignupForm from './SignupForm';
import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: SupportedLanguages }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const seoConfig = await buildSEOConfig(SEO_CONFIGS.signup);
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

export default async function SignupPage() {
  const session = await getAuthSession();
  const t = await getTranslations('public.auth.register');
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.signup);

  if (session) {
    redirect('/dashboards');
  }

  if (!isFeatureEnabled('enableRegistration')) {
    return (
      <>
        <StructuredData config={seoConfig} />
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
      </>
    );
  }

  const providers = await getProviders();

  return (
    <>
      <StructuredData config={seoConfig} />
      <SignupForm providers={providers} />
    </>
  );
}
