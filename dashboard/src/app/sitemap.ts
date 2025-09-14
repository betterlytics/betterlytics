import { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { SUPPORTED_LANGUAGES, type SupportedLanguages } from '@/constants/i18n';

type PageCfg = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'];
  priority: number;
  localized: boolean;
};

const PAGES: PageCfg[] = [
  // Localized public pages
  { path: '/', changeFrequency: 'monthly', priority: 1, localized: true },
  { path: '/register', changeFrequency: 'yearly', priority: 0.5, localized: true },
  { path: '/signin', changeFrequency: 'yearly', priority: 0.5, localized: true },
  { path: '/about', changeFrequency: 'yearly', priority: 0.8, localized: true },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.8, localized: true },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.4, localized: true },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.4, localized: true },
  { path: '/dpa', changeFrequency: 'monthly', priority: 0.4, localized: true },

  /****************** PUBLIC PAGES ******************/

  // Non-localized docs
  { path: '/docs', changeFrequency: 'weekly', priority: 0.8, localized: false },
  { path: '/docs/installation', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/installation/cloud-hosting', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/installation/self-hosting', changeFrequency: 'monthly', priority: 0.6, localized: false },
  { path: '/docs/integration/custom-events', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/integration/dynamic-urls', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/integration/web-vitals', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/referrers', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/geography', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/user-journey', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/devices', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/events', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/funnels', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/metrics-glossary', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/filtering', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/dashboard/web-vitals', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/pricing', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/pricing/upgrading', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/pricing/changing-plans', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/pricing/managing-subscription', changeFrequency: 'monthly', priority: 0.8, localized: false },
  { path: '/docs/pricing/cancellation', changeFrequency: 'monthly', priority: 0.8, localized: false },
];

const localizedPath = (path: string, locale: SupportedLanguages) => {
  if (locale === env.NEXT_PUBLIC_DEFAULT_LANGUAGE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.PUBLIC_BASE_URL;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  if (!env.IS_CLOUD) {
    return entries;
  }

  for (const page of PAGES) {
    if (!page.localized) {
      entries.push({
        url: `${baseUrl}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
      continue;
    }

    const languages: Record<string, string> = {};
    for (const alt of SUPPORTED_LANGUAGES) {
      languages[alt] = `${baseUrl}${localizedPath(page.path, alt)}`;
    }

    entries.push({
      url: `${baseUrl}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    });
  }

  return entries;
}
