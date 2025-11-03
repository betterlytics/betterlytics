'use server';

import { cookies } from 'next/headers';

export async function getUserTimezone() {
  const cookieStore = await cookies();
  const timezone = cookieStore.get('bl_tz')?.value;
  return timezone ?? 'Etc/UTC';
}
