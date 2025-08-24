import { redirect } from 'next/navigation';
import { redirect as i18nRedirect } from '@/i18n/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LandingPage from './(landing)/landingPage';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { getLocale, getTranslations } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';

export default async function HomePage() {
  if (!isClientFeatureEnabled('isCloud')) {
    const session = await getServerSession(authOptions);
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
  const t = await getTranslations({ locale, namespace: 'public.landing.seo' });
  const seoConfig = { ...SEO_CONFIGS.landing, title: t('title'), description: t('description') } as const;
  return generateSEO(seoConfig, { locale });
}
