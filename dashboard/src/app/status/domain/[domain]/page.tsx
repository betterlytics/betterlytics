import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { normalizeHostname } from '@/services/analytics/statusPageDomain.service';
import { getPublicStatusPageDataByDomain } from '@/services/analytics/publicStatusPage.service';
import { buildStatusPageMetadata, StatusPageShell } from '@/app/status/shared/statusPageShell';

/**
 * Custom-domain (tier-2) status host entry point. Caddy rewrites the custom
 * domain's `/` to `/status/domain/{host}`
 */
export const revalidate = 60;

type StatusPageParams = { params: Promise<{ domain: string }> };

const resolveStatusPage = cache(async (rawDomain: string) => {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    return null;
  }
  const domain = normalizeHostname(rawDomain);
  if (!domain) return null;
  return getPublicStatusPageDataByDomain(domain);
});

export async function generateMetadata({ params }: StatusPageParams): Promise<Metadata> {
  const { domain } = await params;
  const data = await resolveStatusPage(domain);
  // `manifest: null` opts out of the app-wide web manifest even on the not-found path.
  return data ? buildStatusPageMetadata(data) : { manifest: null };
}

export default async function PublicStatusPageByDomain({ params }: StatusPageParams) {
  const { domain } = await params;
  const data = await resolveStatusPage(domain);
  if (!data) {
    notFound();
  }

  return <StatusPageShell data={data} />;
}
