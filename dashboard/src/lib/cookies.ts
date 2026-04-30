'use server';

import { cookies } from 'next/headers';
import { BATimeZone } from '@/entities/analytics/analyticsQuery.entities';

export async function getUserTimezone() {
  const cookieStore = await cookies();
  const timezone = cookieStore.get('bl_tz')?.value;
  return BATimeZone.parse(timezone ?? 'Etc/UTC');
}
