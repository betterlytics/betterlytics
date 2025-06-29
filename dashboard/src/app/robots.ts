import { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_BASE_URL;

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
