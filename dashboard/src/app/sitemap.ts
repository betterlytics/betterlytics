import { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { SUPPORTED_LANGUAGES } from '@/constants/supportedLanguages';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_BASE_URL;
  const lastModified = new Date();

  const localizedPaths = [
    '', 
    '/about',
    '/contact',
    '/register',
    '/signin',
    '/privacy',
    '/terms',
    '/dpa',
  ];

  const docsPaths = [
    '/docs',
    '/docs/installation',
    '/docs/installation/cloud-hosting',
    '/docs/installation/self-hosting',
    '/docs/integration/custom-events',
    '/docs/integration/dynamic-urls',
    '/docs/dashboard',
    '/docs/dashboard/referrers',
    '/docs/dashboard/geography',
    '/docs/dashboard/user-journey',
    '/docs/dashboard/devices',
    '/docs/dashboard/events',
    '/docs/dashboard/funnels',
    '/docs/dashboard/metrics-glossary',
    '/docs/dashboard/filtering',
    '/docs/pricing',
    '/docs/pricing/upgrading',
    '/docs/pricing/changing-plans',
    '/docs/pricing/managing-subscription',
    '/docs/pricing/cancellation',
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  for (const lang of SUPPORTED_LANGUAGES) {
    for (const path of localizedPaths) {
      sitemap.push({
        url: `${baseUrl}/${lang}${path}`,
        lastModified,
        changeFrequency: path === '' ? 'monthly' : 'yearly',
        priority: path === '' ? 1 : 0.6,
      });
    }
  }

  // Add docs paths (not localized)
  for (const path of docsPaths) {
    sitemap.push({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  return sitemap;
}
