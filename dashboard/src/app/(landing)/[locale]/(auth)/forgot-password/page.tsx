import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import { StructuredData } from '@/components/StructuredData';
import type { SupportedLanguages } from '@/constants/i18n';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { ForgotPasswordPanel } from '@/landing/components/auth/forgotPasswordPanel';
import { authMetadata } from '@/landing/components/auth/metadata';

type Props = { params: Promise<{ locale: SupportedLanguages }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return authMetadata(locale, 'forgotPassword');
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await getAuthSession()) {
    redirect('/dashboards');
  }
  // the link goes out by email
  if (!isFeatureEnabled('enableEmails')) {
    redirect('/signin');
  }

  return (
    <>
      <StructuredData config={await buildSEOConfig(SEO_CONFIGS.forgotPassword)} />
      <ForgotPasswordPanel />
    </>
  );
}
