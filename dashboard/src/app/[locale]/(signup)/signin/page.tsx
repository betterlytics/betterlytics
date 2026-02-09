import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import type { SupportedLanguages } from '@/constants/i18n';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { StructuredData } from '@/components/StructuredData';
import { getAuthSession } from '@/auth/auth-actions';

interface SignInPageProps {
  searchParams: Promise<{
    error?: string;
    callbackUrl?: string;
    verified?: string;
    registration?: string;
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
  const emailsEnabled = isFeatureEnabled('enableEmails');
  const { error, registration } = await searchParams;
  const t = await getTranslations('public.auth.signin');
  const tOnboarding = await getTranslations('onboarding');

  const registrationDisabledMessage = registration === 'disabled' ? tOnboarding('registrationDisabled') : null;
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.signin);

  if (session) {
    redirect('/dashboards');
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return t('errors.CredentialsSignin');
      case 'OAuthAccountNotLinked':
        return t('errors.OAuthAccountNotLinked');
      default:
        return t('errors.default');
    }
  };

  return (
    <>
      <StructuredData config={seoConfig} />
      <main className='relative flex w-full flex-1 flex-col items-center justify-center gap-2 py-8'>
        <div className='w-full max-w-md space-y-6 px-4'>
          <div className='flex justify-center pb-2'>
            <Link href='/'>
              <Logo variant='simple' showText textSize='lg' priority />
            </Link>
          </div>
          <Card className='bg-card rounded-lg border p-0 shadow-sm'>
            <CardContent className='space-y-3 p-3 py-6 sm:p-6'>
              <h2 className='text-center text-2xl font-semibold'>{t('title')}</h2>
              {error && (
                <div
                  className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3'
                  role='alert'
                >
                  <span className='block sm:inline'>{getErrorMessage(error)}</span>
                </div>
              )}
              <LoginForm
                registrationDisabledMessage={registrationDisabledMessage}
                forgotPasswordEnabled={emailsEnabled}
              />
            </CardContent>
          </Card>
          {registrationEnabled && (
            <div className='text-center'>
              <p className='text-muted-foreground text-sm'>
                {t('cta.noAccount')}{' '}
                <Link href='/signup' className='text-primary hover:text-primary/80 font-medium' tabIndex={2}>
                  {t('cta.createOne')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
