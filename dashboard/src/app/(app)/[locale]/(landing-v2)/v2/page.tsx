import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { COPY } from './content/copy';
import { LandingV2 } from './landingV2';

/**
 * Preview route for the landing redesign. Replaces the (public) landing page
 * once it's done; until then it is served only on the cloud build and kept
 * out of search indexes.
 */
export default function LandingV2Page() {
  if (!isClientFeatureEnabled('isCloud')) {
    notFound();
  }
  return <LandingV2 />;
}

export const metadata: Metadata = {
  title: COPY.seo.title,
  description: COPY.seo.description,
  robots: { index: false, follow: false },
};
