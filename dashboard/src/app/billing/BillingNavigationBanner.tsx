import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function BillingNavigationBanner() {
  return (
    <div className='bg-card/50 border-b'>
      <div className='container mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link
              href='/dashboard'
              className='text-muted-foreground hover:text-foreground flex items-center gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Dashboard
            </Link>
            <div className='bg-border h-4 w-px' />
            <h1 className='text-xl font-semibold'>Choose Your Plan</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
