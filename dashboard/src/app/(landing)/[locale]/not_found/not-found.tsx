import { redirect } from 'next/navigation';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { NotFoundView } from '@/landing/components/notFound/notFoundView';

/** Beside its one page, not in [locale]: Next writes a segment's not-found into the payload of every page below it. */
export default function LandingNotFound() {
  if (!isClientFeatureEnabled('isCloud')) {
    redirect('/dashboards');
  }
  return <NotFoundView />;
}
