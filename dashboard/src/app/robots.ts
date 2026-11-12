import { MetadataRoute } from 'next';
import { env } from '@/lib/env';

// Hosted images are built once for staging and prod, so ALLOW_CRAWLING must be read per request
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.PUBLIC_BASE_URL;

  if (!env.ALLOW_CRAWLING) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/*',
          '/dashboards/*',
          '/billing/*',
          '/api/*',
          '/share/*',
          '/*/share/*',
          '/demo',
          '/*/demo',
          '/onboarding',
          '/*/onboarding',
          '/onboarding/*',
          '/*/onboarding/*',
          '/accept-invite',
          '/*/accept-invite',
          '/accept-invite/*',
          '/*/accept-invite/*',
          '/forgot-password',
          '/*/forgot-password',
          '/reset-password',
          '/*/reset-password',
          '/verify-email',
          '/*/verify-email',
          '/admin',
          '/admin/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
