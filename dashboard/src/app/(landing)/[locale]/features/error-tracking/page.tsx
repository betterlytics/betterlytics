import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/JsonLd';
import type { SupportedLanguages } from '@/constants/i18n';
import { getPathname } from '@/i18n/navigation';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { env } from '@/lib/env';
import { generateSEO } from '@/lib/seo';
import { landingClientMessages } from '@/landing/lib/clientMessages';
import { ErrorsPage } from './errorsPage';

type Props = { params: Promise<{ locale: SupportedLanguages }> };

const PATH = '/features/error-tracking';

export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing.errors');
  return generateSEO(
    {
      title: t('seo.title'),
      description: t('seo.description'),
      path: PATH,
      socialTitle: t('hero.title'),
      socialDescription: t('hero.lede'),
      structuredDataType: 'webpage',
    },
    { locale },
  );
}

export default async function ErrorTrackingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isClientFeatureEnabled('isCloud')) {
    redirect('/dashboards');
  }
  const [messages, t, tFeature] = await Promise.all([
    getMessages(),
    getTranslations('landing.errors'),
    getTranslations('landing.feature'),
  ]);
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: tFeature('features'),
        item: `${env.PUBLIC_BASE_URL}${getPathname({ href: '/features', locale })}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('hero.eyebrow'),
        item: `${env.PUBLIC_BASE_URL}${getPathname({ href: PATH, locale })}`,
      },
    ],
  };
  return (
    <NextIntlClientProvider messages={landingClientMessages(messages, { errors: messages.landing.errors })}>
      <JsonLd data={breadcrumbs} />
      <ErrorsPage />
    </NextIntlClientProvider>
  );
}
