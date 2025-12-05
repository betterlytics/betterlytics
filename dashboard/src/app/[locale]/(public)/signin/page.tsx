import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import type { SupportedLanguages } from '@/constants/i18n';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { VerificationSuccessHandler } from '@/components/accountVerification/VerificationSuccessHandler';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { StructuredData } from '@/components/StructuredData';
import { getAuthSession } from '@/auth/auth-actions';

interface SignInPageProps {
  searchParams: Promise<{
    error?: string;
    callbackUrl?: string;
    verified?: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: SupportedLanguages }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.signin);
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

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getAuthSession();
  const registrationEnabled = isFeatureEnabled('enableRegistration');
  const { error } = await searchParams;
  const t = await getTranslations('public.auth.signin');
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.signin);

  if (session) {
    redirect('/dashboards');
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return t('errors.CredentialsSignin');
      default:
        return t('errors.default');
    }
  };

  return (
    <>
      <StructuredData config={seoConfig} />
      <div className='bg-background flex items-center justify-center px-4 py-12 sm:px-6 sm:pt-20 lg:px-8'>
        <VerificationSuccessHandler />

        <div className='w-full max-w-md space-y-8'>
          <div className='text-center'>
            <div className='mb-6 flex justify-center'>
              <Logo variant='full' width={200} height={60} priority />
            </div>
            <h2 className='text-foreground mt-6 text-2xl font-semibold'>{t('title')}</h2>
            <p className='text-muted-foreground mt-2 text-sm'>{t('subtitle')}</p>
          </div>
          <Card className='p-0 shadow-sm'>
            <CardContent className='p-3 py-8 sm:p-8'>
              {error && (
                <div
                  className='bg-destructive/10 border-destructive/20 text-destructive mb-6 rounded-md border px-4 py-3'
                  role='alert'
                >
                  <span className='block sm:inline'>{getErrorMessage(error)}</span>
                </div>
              )}
              <LoginForm />
              {registrationEnabled && (
                <div className='mt-6 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    {t('cta.noAccount')}{' '}
                    <Link
                      href='/onboarding'
                      className='text-primary hover:text-primary/80 font-medium underline'
                      tabIndex={2}
                    >
                      {t('cta.createOne')}
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
