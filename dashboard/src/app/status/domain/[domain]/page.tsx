import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getPublicStatusPageDataByDomain } from '@/services/analytics/publicStatusPage.service';
import { buildStatusPageMetadata, StatusPageShell } from '@/app/status/shared/statusPageShell';

export const revalidate = 60;

type StatusPageParams = { params: Promise<{ domain: string }> };

const resolveStatusPage = cache(async (domain: string) => {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    return null;
  }
  return getPublicStatusPageDataByDomain(decodeURIComponent(domain));
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
