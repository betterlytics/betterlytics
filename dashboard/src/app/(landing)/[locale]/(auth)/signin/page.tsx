import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import { toSafeRelativePath } from '@/lib/auth/safe-redirect';
import { getEnabledOAuthProviders } from '@/lib/better-auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { isFirstUser } from '@/services/auth/signupGate.service';
import { AuthPanel, AuthPrompt } from '@/landing/components/auth/authPanel';
import { authMetadata } from '@/landing/components/auth/metadata';
import { SignInForm } from '@/landing/components/auth/signInForm';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  searchParams: Promise<{ error?: string; callbackUrl?: string | string[]; registration?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return authMetadata(locale, 'signin');
}

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { error, callbackUrl, registration } = await searchParams;
  const redirectTo = toSafeRelativePath(callbackUrl, '/dashboards');

  if (await getAuthSession()) {
    redirect(redirectTo);
  }

  const registrationEnabled = isFeatureEnabled('enableRegistration');
  // a fresh self-hosted instance has nobody to sign in as yet
  if (!registrationEnabled && (await isFirstUser())) {
    redirect('/signup');
  }

  const t = await getTranslations('public.auth.signin');

  return (
    <>
      <StructuredData config={await buildSEOConfig(SEO_CONFIGS.signin)} />
      <AuthPanel
        title={t('title')}
        lede={t('lede')}
        foot={
          registrationEnabled ? (
            <AuthPrompt lead={t('noAccount')} href='/signup' label={t('createAccount')} />
          ) : (
            <p className='text-center text-label text-muted'>{t('askAdmin')}</p>
          )
        }
      >
        <SignInForm
          providers={getEnabledOAuthProviders()}
          forgotPassword={isFeatureEnabled('enableEmails')}
          redirectTo={redirectTo}
          initialError={
            error ? t(error === 'account_not_linked' ? 'errors.accountNotLinked' : 'errors.default') : null
          }
          notice={registration === 'disabled' ? t('registrationDisabled') : null}
        />
      </AuthPanel>
    </>
  );
}
