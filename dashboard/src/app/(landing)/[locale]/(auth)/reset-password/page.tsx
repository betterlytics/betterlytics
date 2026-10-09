import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import { resetLinkProblem } from '@/lib/auth/auth-page-state';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { findResetTokenEmail } from '@/services/auth/passwordReset.service';
import { AuthAction, AuthPanel, AuthPrompt } from '@/landing/components/auth/authPanel';
import { authMetadata } from '@/landing/components/auth/metadata';
import { ResetPasswordPanel } from '@/landing/components/auth/resetPasswordPanel';

type Props = {
  params: Promise<{ locale: SupportedLanguages }>;
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
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

  const query = await searchParams;
  // a repeated parameter arrives as an array, which no link of ours makes
  const token = typeof query.token === 'string' ? query.token : undefined;
  const error = typeof query.error === 'string' ? query.error : undefined;
  const structuredData = <StructuredData config={await buildSEOConfig(SEO_CONFIGS.resetPassword)} />;
  const accountEmail = token && !error ? await findResetTokenEmail(token) : null;
  const problem = resetLinkProblem({ token, error, tokenIsLive: accountEmail !== null });

  if (!problem && token && accountEmail) {
    return (
      <>
        {structuredData}
        <ResetPasswordPanel token={token} email={accountEmail} />
      </>
    );
  }

  const t = await getTranslations('public.auth.resetPassword');
  const state = problem ?? 'invalid';
  return (
    <>
      {structuredData}
      <AuthPanel
        title={t(`${state}.title`)}
        lede={t(`${state}.description`)}
        foot={<AuthPrompt lead={t('remember')} href='/signin' label={t('signIn')} />}
      >
        <AuthAction href='/forgot-password' label={t('requestLink')} />
      </AuthPanel>
    </>
  );
}
