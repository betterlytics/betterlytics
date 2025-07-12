import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  path: string;
  imageAlt?: string;
  structuredData?: 'organization' | 'website' | 'webpage' | 'contact';
}

const BASE_URL = 'https://betterlytics.io';
const DEFAULT_IMAGE = '/betterlytics-logo-full-light.png';

export function generateSEO({ title, description, keywords, path, imageAlt }: SEOConfig): Metadata {
  const fullTitle = title.includes('Betterlytics') ? title : `${title} - Betterlytics`;
  const fullUrl = `${BASE_URL}${path}`;
  const imageAltText = imageAlt || `${fullTitle} - Simple, Cookieless, Privacy-First Web Analytics`;

  return {
    title: fullTitle,
    description,
    keywords,
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
    },
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      url: fullUrl,
      title: fullTitle,
      description,
      siteName: 'Betterlytics',
      images: [
        {
          url: DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          alt: imageAltText,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [DEFAULT_IMAGE],
      creator: '@betterlytics',
    },
    robots: {
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
    icons: {
      icon: [
        { url: '/images/favicon-dark.svg', media: '(prefers-color-scheme: light)', type: 'image/svg+xml' },
        { url: '/images/favicon-light.svg', media: '(prefers-color-scheme: dark)', type: 'image/svg+xml' },
      ],
    },
  };
}

// JSON-LD Structured Data generator
export function generateStructuredData(
  type: 'organization' | 'website' | 'webpage' | 'contact',
  config: SEOConfig,
) {
  const fullUrl = `${BASE_URL}${config.path}`;

  switch (type) {
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Betterlytics',
        url: BASE_URL,
        logo: `${BASE_URL}/betterlytics-logo-full-light.png`,
        description:
          'Privacy-first, cookieless, open-source web analytics platform that respects user privacy while delivering powerful insights.',
        foundingDate: '2024',
        sameAs: ['https://github.com/betterlytics/betterlytics'],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'hello@betterlytics.io',
        },
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'DK',
        },
        areaServed: 'Worldwide',
        knowsAbout: [
          'Web Analytics',
          'Privacy-First Analytics',
          'GDPR Compliance',
          'Cookieless Tracking',
          'Open Source Software',
        ],
      };

    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Betterlytics',
        url: BASE_URL,
        description: 'Privacy-first, cookieless, open-source web analytics platform',
        publisher: {
          '@type': 'Organization',
          name: 'Betterlytics',
          logo: `${BASE_URL}/betterlytics-logo-full-light.png`,
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
              name: 'Home',
              item: BASE_URL,
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
        mainEntity: {
          '@type': 'Organization',
          name: 'Betterlytics',
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              email: 'hello@betterlytics.io',
              availableLanguage: 'English',
            },
            {
              '@type': 'ContactPoint',
              contactType: 'technical support',
              email: 'support@betterlytics.io',
              availableLanguage: 'English',
            },
          ],
        },
      };

    default:
      return null;
  }
}

export const SEO_CONFIGS = {
  landing: {
    title: 'Betterlytics | Simple, Cookieless, Privacy-Friendly Web Analytics',
    description:
      'Betterlytics is a privacy-first Google Analytics alternative. Get GDPR-compliant, cookieless insights without invasive tracking. Simple, open-source, and easy to use.',
    keywords: [
      'Google Analytics Alternative',
      'Web Analytics',
      'Privacy-Friendly Analytics',
      'GDPR Compliant Analytics',
      'Cookieless Website Tracking',
      'Open Source Web Analytics',
      'Privacy-First Analytics',
      'Website Traffic Analysis',
      'Visitor Analytics',
      'Betterlytics Analytics Platform',
    ] as string[],
    path: '/',
    structuredData: 'website' as const,
  },
  contact: {
    title: 'Contact Us | Betterlytics',
    description:
      'Need help or have questions? Contact the Betterlytics team for support, feedback, or inquiries about our privacy-first web analytics platform.',
    keywords: [
      'Contact Betterlytics',
      'Betterlytics Support',
      'Web Analytics Help',
      'Privacy Analytics Support',
      'GDPR Analytics Contact',
      'Cookieless Analytics Support',
      'Analytics Support Team',
      'Betterlytics Contact Form',
    ] as string[],
    path: '/contact',
    structuredData: 'contact' as const,
  },
  about: {
    title: 'About Betterlytics | Privacy-First Web Analytics',
    description:
      'Discover the story behind Betterlytics - building open-source, cookieless web analytics that prioritize user privacy and GDPR compliance.',
    keywords: [
      'About Betterlytics',
      'Privacy-First Analytics',
      'Open Source Analytics',
      'Cookieless Analytics',
      'GDPR Compliant Analytics',
      'Privacy Analytics Company',
      'Web Analytics Mission',
      'Betterlytics Story',
      'Analytics Without Cookies',
    ] as string[],
    path: '/about',
    structuredData: 'webpage' as const,
  },
  privacy: {
    title: 'Privacy Policy | Betterlytics',
    description:
      'Betterlytics Privacy Policy - GDPR-compliant and cookieless by design. Learn how we protect data and ensure user privacy through anonymous analytics.',
    keywords: [
      'Privacy Policy',
      'GDPR Compliance',
      'Data Privacy',
      'Data Protection',
      'Cookieless Analytics',
      'Anonymous Web Analytics',
      'User Privacy',
      'Betterlytics Privacy Policy',
      'Privacy-Focused Analytics',
    ] as string[],
    path: '/privacy',
    structuredData: 'webpage' as const,
  },
  terms: {
    title: 'Terms of Service | Betterlytics',
    description:
      'Betterlytics Terms of Service - outlining your rights, responsibilities, and usage rules for our privacy-focused analytics platform.',
    keywords: [
      'Terms of Service',
      'Terms and Conditions',
      'Betterlytics Terms',
      'Analytics Service Agreement',
      'Web Analytics Terms',
      'Privacy Analytics Terms',
      'Usage Terms',
      'Legal Agreement Betterlytics',
    ] as string[],
    path: '/terms',
    structuredData: 'webpage' as const,
  },
  dpa: {
    title: 'Data Processing Agreement | Betterlytics',
    description:
      'Betterlytics Data Processing Agreement (DPA) - designed for full GDPR compliance, privacy-first analytics, and secure anonymous data processing.',
    keywords: [
      'Data Processing Agreement',
      'DPA',
      'GDPR compliance',
      'GDPR DPA',
      'data privacy',
      'data protection agreement',
      'privacy analytics',
      'anonymous analytics',
      'Betterlytics DPA',
      'web analytics GDPR',
    ] as string[],
    path: '/dpa',
    structuredData: 'webpage' as const,
  },
} as const;
