import type { Metadata } from 'next';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';

const SELF_HOSTED_SEO = {
  signin: SEO_CONFIGS.signinSelfHosted,
  signup: SEO_CONFIGS.signupSelfHosted,
} as const;

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
  const config =
    !isFeatureEnabled('isCloud') && (page === 'signin' || page === 'signup')
      ? SELF_HOSTED_SEO[page]
      : SEO_CONFIGS[page];
  return generateSEO(await buildSEOConfig(config), { locale, robots: NO_INDEX });
}
