import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/feature-flags';

type ErrorDetailPageParams = {
  params: Promise<{ dashboardId: string; fingerprint: string }>;
};

export default async function ErrorDetailPage({ params }: ErrorDetailPageParams) {
  if (!isFeatureEnabled('enableErrorTracking')) {
    notFound();
  }
  const { dashboardId, fingerprint } = await params;

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <div className='mb-4 flex items-center gap-2'>
        <Link
          href={`/dashboard/${dashboardId}/errors`}
          className='text-muted-foreground hover:text-foreground transition-colors'
          aria-label='Back to errors'
        >
          <ChevronLeft className='h-5 w-5' />
        </Link>
        <h1 className='font-mono text-xl font-semibold'>{fingerprint}</h1>
      </div>
    </div>
  );
}
