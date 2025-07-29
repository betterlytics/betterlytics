import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://betterlytics.io';

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
