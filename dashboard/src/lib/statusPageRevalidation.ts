import 'server-only';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

/**
 * Drops the cached public pages of status pages released by a dashboard or account deletion. Runs after
 * the response: revalidating inside the action re-renders its current route, which no longer opens.
 */
export function revalidateReleasedStatusPages(slugs: string[]): void {
  if (slugs.length === 0) return;
  after(() => {
    for (const slug of slugs) {
      revalidatePath(`/status/${slug}`);
    }
  });
}
