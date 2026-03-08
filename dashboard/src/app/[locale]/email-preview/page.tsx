import { EmailTestForm } from '@/app/[locale]/email-preview/EmailTestForm';
import { EmailPreviewCard } from '@/app/[locale]/email-preview/EmailPreviewCard';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { notFound } from 'next/navigation';

export default function EmailTestPage() {
  if (!isFeatureEnabled('enableEmailPreview')) {
    notFound();
  }

  return (
    <div className='container mx-auto space-y-8 py-8'>
      <div className='space-y-4'>
        <h1 className='text-3xl font-bold'>Email Testing</h1>
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        <EmailTestForm />
        <EmailPreviewCard />
      </div>
    </div>
  );
}
