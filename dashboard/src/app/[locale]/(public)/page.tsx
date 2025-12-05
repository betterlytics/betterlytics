import { redirect } from 'next/navigation';
import { redirect as i18nRedirect } from '@/i18n/navigation';
import LandingPage from './(landing)/landingPage';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { getLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { getAuthSession } from '@/auth/auth-actions';

export default async function HomePage() {
  if (!isClientFeatureEnabled('isCloud')) {
    const session = await getAuthSession();
    const locale = await getLocale();

    if (session) {
      redirect('/dashboards');
    } else {
      i18nRedirect({ href: '/signin', locale });
    }
  }

  return <LandingPage />;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.landing);
  return generateSEO(seoConfig, { locale });
}
