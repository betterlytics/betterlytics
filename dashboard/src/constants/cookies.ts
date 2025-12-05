import { cookies } from 'next/headers';

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

const LOCALE_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 365, // 1 year
  path: '/',
};

export async function setLocaleCookie(language: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE_NAME, language, LOCALE_COOKIE_OPTIONS);
  } catch {
    // Cookies may not be available in all contexts
  }
}
