import { SUPPORTED_LANGUAGES, SupportedLanguages } from '@/constants/i18n';
import { defineRouting } from 'next-intl/routing';

const defaultLocale = (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ?? 'en') as SupportedLanguages;

export const routing = defineRouting({
  locales: SUPPORTED_LANGUAGES,
  defaultLocale,
  localePrefix: 'as-needed',
});

// The top-level folders of app/(app)/(protected): the signed-in app and admin
const SIGNED_IN_SECTIONS = ['dashboard', 'dashboards', 'billing', 'admin'];

const underSections = (sections: string[]) => new RegExp(`^/(${sections.join('|')})(/|$)`);

// The signed-in app, its API, admin and the English-only blog carry no locale: the middleware skips them, and links
// into them mustn't add one (/da/dashboards is a 404, /da/blog redirects)
const UNLOCALIZED_PATH = underSections(['api', 'blog', ...SIGNED_IN_SECTIONS]);
const SIGNED_IN_PATH = underSections(SIGNED_IN_SECTIONS);

export function isUnlocalizedPath(href: string) {
  return UNLOCALIZED_PATH.test(href.split(/[?#]/, 1)[0]);
}

export function isSignedInPath(pathname: string) {
  return SIGNED_IN_PATH.test(pathname);
}
