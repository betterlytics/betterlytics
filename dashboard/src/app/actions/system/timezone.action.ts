'use server';

import { cookies } from 'next/headers';

export async function setTimezoneCookieAction(tz: string) {
  if (typeof tz !== 'string' || !tz) {
    return { changed: false };
  }

  const cookieStore = await cookies();

  const name = 'bl_tz';
  const current = cookieStore.get(name)?.value;

  if (current === tz) {
    return { changed: false };
  }

  cookieStore.set(name, tz, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  return { changed: true };
}
