'use server';

import { cookies } from 'next/headers';
import { normalizeTimezone } from '@/utils/timezone';

export async function setTimezoneCookieAction(tz: string) {
  const timezone = normalizeTimezone(tz);
  if (!timezone) {
    return { changed: false };
  }

  const cookieStore = await cookies();

  const name = 'bl_tz';
  const current = cookieStore.get(name)?.value;

  if (current === timezone) {
    return { changed: false };
  }

  cookieStore.set(name, timezone, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  return { changed: true };
}
