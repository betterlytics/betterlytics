import { SupportedLanguages } from '@/constants/i18n';
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { LOCALE_COOKIE_NAME } from '@/constants/cookies';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let requested = await requestLocale;

  // Routes without a [locale] segment (the signed-in app). The saved user setting is
  // authoritative so a language change follows the user across devices; the cookie
  // covers signed-out visitors.
  if (!requested) {
    try {
      // Imported lazily: a static import closes a cycle back into next-intl/server, which breaks
      // getLocale() in route handlers such as tRPC.
      const { getCachedSession } = await import('@/auth/api-auth');
      const { getCachedUserSettings } = await import('@/services/account/userSettings.service');
      const session = await getCachedSession();
      if (session?.user) {
        requested = (await getCachedUserSettings(session.user.id)).language;
      }
    } catch {
      // Session may not be resolvable in all contexts (e.g., during build)
    }
  }

  if (!requested) {
    try {
      const cookieStore = await cookies();
      requested = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    } catch {
      // Cookies may not be available in all contexts (e.g., during build)
    }
  }

  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale: locale as SupportedLanguages,
    messages: await loadMessages(locale),
  };
});

type MessageTree = { [key: string]: string | MessageTree };

/** Keys a locale hasn't translated yet fall back to English rather than rendering as raw key paths. */
async function loadMessages(locale: string): Promise<MessageTree> {
  const own: MessageTree = (await import(`../../messages/${locale}.json`)).default;
  if (locale === routing.defaultLocale) return own;
  const fallback: MessageTree = (await import(`../../messages/${routing.defaultLocale}.json`)).default;
  return withFallback(own, fallback);
}

function withFallback(own: MessageTree, fallback: MessageTree): MessageTree {
  const result: MessageTree = { ...fallback };
  for (const [key, value] of Object.entries(own)) {
    const base = fallback[key];
    result[key] = typeof value === 'object' && typeof base === 'object' ? withFallback(value, base) : value;
  }
  return result;
}
