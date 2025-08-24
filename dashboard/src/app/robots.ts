import { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.PUBLIC_BASE_URL;

  if (!env.IS_CLOUD) {
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
        disallow: ['/dashboard/*', '/dashboards/*', '/billing/*', '/api/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
