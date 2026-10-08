import { SUPPORTED_LANGUAGES, SupportedLanguages } from '@/constants/i18n';
import { defineRouting } from 'next-intl/routing';

const defaultLocale = (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ?? 'en') as SupportedLanguages;

export const routing = defineRouting({
  locales: SUPPORTED_LANGUAGES,
  defaultLocale,
  localePrefix: 'as-needed',
});

// The signed-in app, its API and admin carry no locale: the middleware leaves them alone, and a link into them must
// not add one either (/da/dashboards is a 404)
const UNLOCALIZED_PATH = /^\/(api|dashboard|dashboards|billing|admin)(\/|$)/;

/** Whether a path, or a link with a query or hash, lies outside the localized site. */
export function isUnlocalizedPath(href: string) {
  return UNLOCALIZED_PATH.test(href.split(/[?#]/, 1)[0]);
}
