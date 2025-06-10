import { LucideFunnel, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOpenContext } from '@/contexts/OpenContextProvider';

export function FunnelsEmptyState() {
  const { open } = useOpenContext();

  return (
    <div className='mx-auto flex min-h-[600px] max-w-md flex-col items-center justify-center px-4 text-center'>
      <div className='mb-6'>
        <div className='relative'>
          <div className='mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20'>
            <LucideFunnel className='h-12 w-12 text-blue-500' />
          </div>
          <div className='absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500'>
            <Plus className='h-4 w-4 text-white' />
          </div>
        </div>
      </div>

      <h2 className='mb-3 text-2xl font-semibold'>No funnels created yet</h2>

      <p className='text-muted-foreground mb-6 leading-relaxed'>
        Track user journeys through your site and identify where visitors drop off. Create your first funnel to
        start analyzing conversion paths and optimize your user experience.
      </p>

      <Button size='lg' className='mb-8' onClick={open}>
        <Plus className='mr-2 h-5 w-5' />
        Create Your First Funnel
      </Button>

      <div className='space-y-4 text-left'>
        <div className='flex items-start gap-3'>
          <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20'>
            <div className='h-2 w-2 rounded-full bg-blue-500'></div>
          </div>
          <div>
            <h3 className='text-sm font-medium'>Track conversion steps</h3>
            <p className='text-muted-foreground text-xs'>Monitor user progress through custom filters</p>
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20'>
            <div className='h-2 w-2 rounded-full bg-green-500'></div>
          </div>
          <div>
            <h3 className='text-sm font-medium'>Identify drop-off points</h3>
            <p className='text-muted-foreground text-xs'>Find where users abandon their journey</p>
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <div className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20'>
            <div className='h-2 w-2 rounded-full bg-purple-500'></div>
          </div>
          <div>
            <h3 className='text-sm font-medium'>Optimize conversions</h3>
            <p className='text-muted-foreground text-xs'>Improve your product based on data insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
