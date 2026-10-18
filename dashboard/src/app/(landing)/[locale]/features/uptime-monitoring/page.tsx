import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { env } from '@/lib/env';
import { generateSEO } from '@/lib/seo';
import { landingClientMessages } from '@/landing/lib/clientMessages';
import { UptimePage } from './uptimePage';

type Props = { params: Promise<{ locale: SupportedLanguages }> };

const PATH = '/features/uptime-monitoring';

export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing.uptime');
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

export default async function UptimeMonitoringPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!isClientFeatureEnabled('isCloud')) {
    redirect('/dashboards');
  }
  const [messages, t, tFeature] = await Promise.all([
    getMessages(),
    getTranslations('landing.uptime'),
    getTranslations('landing.feature'),
  ]);
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tFeature('features'), item: `${env.PUBLIC_BASE_URL}/features` },
      { '@type': 'ListItem', position: 2, name: t('hero.eyebrow'), item: `${env.PUBLIC_BASE_URL}${PATH}` },
    ],
  };
  return (
    <NextIntlClientProvider messages={landingClientMessages(messages, { uptime: messages.landing.uptime })}>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }}
      />
      <UptimePage />
    </NextIntlClientProvider>
  );
}
