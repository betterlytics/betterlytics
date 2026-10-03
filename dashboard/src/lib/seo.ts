import { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { getLocale, getTranslations } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { LANGUAGE_METADATA } from '@/constants/i18n';
import { env } from './env';

export interface SEOConfig {
  title: string;
  description: string;
  path: string;
  /** Link-preview copy (Open Graph, X); falls back to the title and description. */
  socialTitle?: string;
  socialDescription?: string;
  structuredDataType: 'organization' | 'website' | 'webpage' | 'contact';
}

/** The image repeats the landing hero's headline; redo it when that changes. */
const DEFAULT_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: "“You shouldn't need five tools to understand one website” above the Betterlytics dashboard",
};

export function generateSEO(
  { title, description, path, socialTitle = title, socialDescription = description }: SEOConfig,
  options?: { locale?: string; robots?: Metadata['robots'] },
): Metadata {
  const defaultLocale = routing.defaultLocale;
  const currentLocale = options?.locale ?? defaultLocale;
  const BASE_URL = env.PUBLIC_BASE_URL;
  const localizedPath =
    currentLocale === defaultLocale ? path : path === '/' ? `/${currentLocale}` : `/${currentLocale}${path}`;
  const fullUrl = `${BASE_URL}${localizedPath}`;

  const languages: Record<string, string> = routing.locales.reduce((acc: Record<string, string>, locale) => {
    acc[locale] = locale === defaultLocale ? path : path === '/' ? `/${locale}` : `/${locale}${path}`;
    return acc;
  }, {});

  // x-default helps Google pick a default when the user's language is unknown
  languages['x-default'] = path;

  return {
    title: title,
    description,
    authors: [{ name: 'Betterlytics Team' }],
    creator: 'Betterlytics',
    publisher: 'Betterlytics',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: fullUrl,
      languages,
    },
    openGraph: {
      type: 'website',
      locale:
        LANGUAGE_METADATA[currentLocale as SupportedLanguages]?.ogLocale ??
        LANGUAGE_METADATA[defaultLocale].ogLocale,
      url: fullUrl,
      title: socialTitle,
      description: socialDescription,
      siteName: 'Betterlytics',
      images: [DEFAULT_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: socialDescription,
      images: [DEFAULT_IMAGE],
      creator: '@betterlytics',
    },
    robots: options?.robots ?? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export async function buildSEOConfig(
  configEntry: (typeof SEO_CONFIGS)[keyof typeof SEO_CONFIGS],
): Promise<SEOConfig> {
  const t = await getTranslations(configEntry.namespace);

  const config: SEOConfig = {
    title: t('title'),
    description: t('description'),
    path: configEntry.path,
    structuredDataType: configEntry.structuredDataType,
  };

  if (!config.title || !config.description) {
    throw new Error(`Missing SEO translation for namespace "${configEntry.namespace}"`);
  }

  return config;
}

// JSON-LD Structured Data generator
export async function generateStructuredData(config: SEOConfig) {
  const defaultLocale = routing.defaultLocale;
  const currentLocale = await getLocale();
  const BASE_URL = env.PUBLIC_BASE_URL;

  const localizedPath =
    currentLocale === defaultLocale
      ? config.path
      : config.path === '/'
        ? `/${currentLocale}`
        : `/${currentLocale}${config.path}`;
  const fullUrl = `${BASE_URL}${localizedPath}`;

  const t = await getTranslations('public.structuredData');
  const orgDescription = t.raw('organization.description');
  const contactCustomer = t.raw('organization.contactTypeCustomerService');
  const contactTechnical = t.raw('organization.contactTypeTechnicalSupport');
  const breadcrumbHome = t.raw('webPage.breadcrumbHome');

  switch (config.structuredDataType) {
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Betterlytics',
        url: BASE_URL,
        logo: `${BASE_URL}/betterlytics-logo-full-dark.png`,
        description: orgDescription,
        foundingDate: '2024',
        sameAs: [
          'https://github.com/betterlytics/betterlytics',
          'https://x.com/betterlytics',
          'https://bsky.app/profile/betterlytics.bsky.social',
          'https://www.linkedin.com/company/betterlytics',
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: contactCustomer,
            email: 'hello@betterlytics.io',
            availableLanguage: currentLocale,
          },
          {
            '@type': 'ContactPoint',
            contactType: contactTechnical,
            email: 'support@betterlytics.io',
            availableLanguage: currentLocale,
          },
        ],
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'DK',
        },
        areaServed: 'Worldwide',
        knowsAbout: [
          'Web Analytics',
          'Session Replay',
          'Error Tracking',
          'Core Web Vitals',
          'Uptime Monitoring',
          'Status Pages',
          'Model Context Protocol',
          'Cookieless Tracking',
          'GDPR Compliance',
          'Open Source Software',
        ],
      };

    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Betterlytics',
        url: BASE_URL,
        description: config.description,
        inLanguage: currentLocale,
        publisher: {
          '@type': 'Organization',
          name: 'Betterlytics',
          logo: `${BASE_URL}/betterlytics-logo-full-dark.png`,
        },
      };

    case 'webpage':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: config.title,
        description: config.description,
        url: fullUrl,
        mainEntity: {
          '@type': 'Organization',
          name: 'Betterlytics',
          url: BASE_URL,
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: breadcrumbHome,
              item: currentLocale === defaultLocale ? BASE_URL : `${BASE_URL}/${currentLocale}`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: config.title,
              item: fullUrl,
            },
          ],
        },
      };

    case 'contact':
      return {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: config.title,
        description: config.description,
        url: fullUrl,
        inLanguage: currentLocale,
        mainEntity: {
          '@type': 'Organization',
          name: 'Betterlytics',
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: contactCustomer,
              email: 'hello@betterlytics.io',
              availableLanguage: currentLocale,
            },
            {
              '@type': 'ContactPoint',
              contactType: contactTechnical,
              email: 'support@betterlytics.io',
              availableLanguage: currentLocale,
            },
          ],
        },
      };

    default:
      return null;
  }
}

export const SEO_CONFIGS = {
  about: {
    namespace: 'public.about.seo',
    path: '/about',
    structuredDataType: 'webpage',
  },
  privacy: {
    namespace: 'public.privacy.seo',
    path: '/privacy',
    structuredDataType: 'webpage',
  },
  terms: {
    namespace: 'public.terms.seo',
    path: '/terms',
    structuredDataType: 'webpage',
  },
  dpa: {
    namespace: 'public.dpa.seo',
    path: '/dpa',
    structuredDataType: 'webpage',
  },
  contact: {
    namespace: 'public.contact.seo',
    path: '/contact',
    structuredDataType: 'contact',
  },
  signin: {
    namespace: 'public.auth.signin.seo',
    path: '/signin',
    structuredDataType: 'webpage',
  },
  signup: {
    namespace: 'public.auth.register.seo',
    path: '/signup',
    structuredDataType: 'webpage',
  },
  publicDemo: {
    namespace: 'public.demo.seo',
    path: '/share',
    structuredDataType: 'webpage',
  },
  onboarding: {
    namespace: 'public.auth.register.seo',
    path: '/onboarding',
    structuredDataType: 'webpage',
  },
  changelog: {
    namespace: 'public.changelog.seo',
    path: '/changelog',
    structuredDataType: 'webpage',
  },
  resetPassword: {
    namespace: 'public.auth.resetPassword.seo',
    path: '/reset-password',
    structuredDataType: 'webpage',
  },
  forgotPassword: {
    namespace: 'public.auth.forgotPassword.seo',
    path: '/forgot-password',
    structuredDataType: 'webpage',
  },
  pricing: {
    namespace: 'public.pricing.seo',
    path: '/pricing',
    structuredDataType: 'webpage',
  },
  features: {
    namespace: 'public.features.seo',
    path: '/features',
    structuredDataType: 'webpage',
  },
  subprocessors: {
    namespace: 'public.subprocessors.seo',
    path: '/subprocessors',
    structuredDataType: 'webpage',
  },
  root: {
    namespace: 'public.root.seo',
    path: '/',
    structuredDataType: 'website',
  },
  organization: {
    namespace: 'public.root.seo',
    path: '/',
    structuredDataType: 'organization',
  },
} as const;
