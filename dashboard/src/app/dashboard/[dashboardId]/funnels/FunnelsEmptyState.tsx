import { LucideFunnel, Plus } from 'lucide-react';
import { CreateFunnelDialog } from './CreateFunnelDialog';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('components.funnels.emptyState');

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

      <h2 className='mb-3 text-2xl font-semibold'>{t('title')}</h2>

      <p className='text-muted-foreground mb-6 leading-relaxed'>
        {t('description')}
      </p>

      <CreateFunnelDialog triggerText={t('createButton')} triggerVariant='default' />

      <div className='mt-8 space-y-4 text-left'>
        <FunnelExplanation
          title={t('features.trackSteps')}
          description={t('features.trackStepsDesc')}
          color='blue'
        />
        <FunnelExplanation
          title={t('features.identifyDropoffs')}
          description={t('features.identifyDropoffsDesc')}
          color='green'
        />
        <FunnelExplanation
          title={t('features.optimizeConversions')}
          description={t('features.optimizeConversionsDesc')}
          color='purple'
        />
      </div>
    </div>
  );
}
