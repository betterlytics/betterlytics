import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { isResetTokenValid } from '@/services/auth/passwordReset.service';
import { AuthAction, AuthPanel, AuthPrompt } from '@/landing/components/auth/authPanel';
import { authMetadata } from '@/landing/components/auth/metadata';
import { ResetPasswordPanel } from '@/landing/components/auth/resetPasswordPanel';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  searchParams: Promise<{ token?: string; error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return authMetadata(locale, 'resetPassword');
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await getAuthSession()) {
    redirect('/dashboards');
  }

  // better-auth's emailed link checks the token first, landing here with ?token= or ?error=INVALID_TOKEN
  const { token, error } = await searchParams;
  const structuredData = <StructuredData config={await buildSEOConfig(SEO_CONFIGS.resetPassword)} />;

  if (token && !error && (await isResetTokenValid(token))) {
    return (
      <>
        {structuredData}
        <ResetPasswordPanel token={token} />
      </>
    );
  }

  const t = await getTranslations('public.auth.resetPassword');
  const problem = error || token ? 'expired' : 'invalid';
  return (
    <>
      {structuredData}
      <AuthPanel
        title={t(`${problem}.title`)}
        lede={t(`${problem}.description`)}
        foot={<AuthPrompt lead={t('remember')} href='/signin' label={t('signIn')} />}
      >
        <AuthAction
          note={t(problem === 'expired' ? 'expired.info' : 'invalid.note')}
          href='/forgot-password'
          label={t('requestLink')}
        />
      </AuthPanel>
    </>
  );
}
