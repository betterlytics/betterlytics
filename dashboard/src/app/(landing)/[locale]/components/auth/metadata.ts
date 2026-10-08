import type { Metadata } from 'next';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';

export const NO_INDEX: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    'max-image-preview': 'none',
    'max-snippet': 0,
    'max-video-preview': 0,
  },
};

export async function authMetadata(
  locale: string,
  page: 'signin' | 'signup' | 'forgotPassword' | 'resetPassword',
): Promise<Metadata> {
  return generateSEO(await buildSEOConfig(SEO_CONFIGS[page]), { locale, robots: NO_INDEX });
}
