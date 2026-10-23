import { revalidatePath, revalidateTag } from 'next/cache';
import type { StatusPagePublicRef } from '@/entities/analytics/statusPage/statusPage.entities';
import { statusPageDomainCacheTag } from '@/entities/analytics/statusPage/statusPage.helpers';

/** Refreshes the dashboard list plus every public URL of the given pages (pass the previous ref too after a change). */
export function revalidateStatusPagePaths(
  dashboardId: string,
  ...pages: Array<StatusPagePublicRef | null | undefined>
) {
  revalidatePath(`/dashboard/${dashboardId}/status-pages`);
  const paths = new Set<string>();
  for (const page of pages) {
    if (!page) continue;
    paths.add(`/status/${page.slug}`);
    if (page.customDomain) {
      paths.add(`/status/domain/${page.customDomain}`);
      revalidateTag(statusPageDomainCacheTag(page.customDomain));
    }
  }
  for (const path of paths) {
    revalidatePath(path);
  }
}
