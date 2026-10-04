import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getPublicStatusPageData } from '@/services/analytics/publicStatusPage.service';
import {
  buildStatusPageMetadata,
  buildStatusPageNotFoundMetadata,
  StatusPageShell,
} from '@/app/status/shared/statusPageShell';

export const revalidate = 60;

type StatusPageParams = { params: Promise<{ slug: string }> };

const resolveStatusPage = cache(async (slug: string) => {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    return null;
  }
  return getPublicStatusPageData(slug);
});

export async function generateMetadata({ params }: StatusPageParams): Promise<Metadata> {
  const { slug } = await params;
  const data = await resolveStatusPage(slug);
  return data ? buildStatusPageMetadata(data) : buildStatusPageNotFoundMetadata();
}

export default async function PublicStatusPage({ params }: StatusPageParams) {
  const { slug } = await params;
  const data = await resolveStatusPage(slug);
  if (!data) {
    notFound();
  }

  return <StatusPageShell data={data} />;
}
