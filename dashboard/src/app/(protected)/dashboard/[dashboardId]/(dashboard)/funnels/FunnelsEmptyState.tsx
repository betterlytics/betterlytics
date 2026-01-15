'use client';

import { useTranslations } from 'next-intl';
import { CreateFunnelDialog } from './CreateFunnelDialog';
import { Card } from '@/components/ui/card';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

const MOCK_FUNNEL_STEPS = [
  { name: 'homepage', visitors: '2,847', percentage: 100 },
  { name: 'pricing', visitors: '1,923', percentage: 68 },
  { name: 'signup', visitors: '847', percentage: 30 },
  { name: 'purchase', visitors: '312', percentage: 11 },
];

function SkeletonFunnelStep({
  step,
  index,
  isLast,
}: {
  step: (typeof MOCK_FUNNEL_STEPS)[0];
  index: number;
  isLast: boolean;
}) {
  const t = useTranslations('components.funnels.skeleton');

  return (
    <div className='flex flex-col'>
      <div className='border-border/30 border-b px-3 pt-2 pb-1.5'>
        <p className='text-muted-foreground/60 text-[10px] font-medium tracking-wide uppercase'>
          {t('step')} {index + 1}
        </p>
        <h4 className='text-foreground/70 truncate text-sm font-semibold'>{t(`steps.${step.name}` as any)}</h4>
      </div>

      <div className='flex h-28 items-end px-1 pt-2'>
        <div className='relative flex h-full w-full items-end'>
          <div
            className='from-primary/80 to-primary/50 w-full rounded-t-sm bg-gradient-to-t'
            style={{ height: `${step.percentage}%` }}
          />
          {!isLast && (
            <div className='absolute right-0 bottom-0 h-full w-6 -translate-x-1/2 translate-x-full'>
              <svg className='h-full w-full' preserveAspectRatio='none' viewBox='0 0 24 100'>
                <path
                  d={`M 0 ${100 - step.percentage} L 24 ${100 - MOCK_FUNNEL_STEPS[index + 1].percentage} L 24 100 L 0 100 Z`}
                  className='fill-primary/25'
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className='flex flex-col items-center py-2'>
        <p className='text-muted-foreground/60 text-[10px]'>{t('visitors')}</p>
        <p className='text-foreground/70 text-sm font-semibold'>{step.visitors}</p>
        <p className='text-muted-foreground/50 text-[10px]'>{step.percentage}%</p>
      </div>
    </div>
  );
}

function SkeletonFunnel() {
  return (
    <Card className='border-border/40 bg-card/50 overflow-hidden p-2'>
      <div className='flex'>
        {MOCK_FUNNEL_STEPS.map((step, i) => (
          <div key={step.name} className='min-w-0 flex-1'>
            <SkeletonFunnelStep step={step} index={i} isLast={i === MOCK_FUNNEL_STEPS.length - 1} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FunnelsEmptyState() {
  const t = useTranslations('components.funnels.emptyState');

  return (
    <div className='relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center px-4 pt-14 pb-4 sm:justify-center sm:py-4'>
      <div className='pointer-events-none absolute inset-0' aria-hidden>
        <div className='bg-primary/5 absolute top-1/3 left-0 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl' />
        <div className='absolute right-0 bottom-1/3 h-40 w-40 translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl' />
      </div>

      <div className='relative flex flex-1 flex-col justify-center space-y-6 sm:order-2 sm:flex-none sm:pt-8'>
        <div className='space-y-3 text-center'>
          <h2 className='text-2xl font-semibold tracking-tight'>{t('title')}</h2>
          <p className='text-muted-foreground mx-auto max-w-md text-sm leading-relaxed'>{t('description')}</p>
        </div>
        <div className='hidden justify-center xl:flex'>
          <PermissionGate>
            {(disabled) => (
              <CreateFunnelDialog triggerText={t('createButton')} triggerVariant='default' disabled={disabled} />
            )}
          </PermissionGate>
        </div>
      </div>

      <div className='relative mt-auto w-full opacity-50 sm:order-1 sm:mt-0'>
        <SkeletonFunnel />
      </div>
    </div>
  );
}
