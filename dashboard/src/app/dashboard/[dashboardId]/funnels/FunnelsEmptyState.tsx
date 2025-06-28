import { LucideFunnel, Plus } from 'lucide-react';
import { CreateFunnelDialog } from './CreateFunnelDialog';
import { cn } from '@/lib/utils';

type FunnelExplanationProps = {
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple';
};
function FunnelExplanation({ title, description, color }: FunnelExplanationProps) {
  return (
    <div className='flex items-start gap-3'>
      <div
        className={cn(
          'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
          color === 'blue' && 'bg-blue-500/20',
          color === 'green' && 'bg-green-500/20',
          color === 'purple' && 'bg-purple-500/20',
        )}
      >
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            color === 'blue' && 'bg-blue-500',
            color === 'green' && 'bg-green-500',
            color === 'purple' && 'bg-purple-500',
          )}
        ></div>
      </div>
      <div>
        <h3 className='text-sm font-medium'>{title}</h3>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
    </div>
  );
}

export function FunnelsEmptyState() {
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

      <CreateFunnelDialog triggerText='Create your first Funnel' triggerVariant='default' />

      <div className='mt-8 space-y-4 text-left'>
        <FunnelExplanation
          title='Track conversion steps'
          description='Monitor user progress through custom filters'
          color='blue'
        />
        <FunnelExplanation
          title='Identify drop-off points'
          description='Find where users abandon their journey'
          color='green'
        />
        <FunnelExplanation
          title='Optimize conversions'
          description='Improve your product based on data insights'
          color='purple'
        />
      </div>
    </div>
  );
}
