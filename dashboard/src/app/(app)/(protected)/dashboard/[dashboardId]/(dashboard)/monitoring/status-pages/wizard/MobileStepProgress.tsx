'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { STEPS } from './steps';

/** Compact step indicator for mobile, where the full WizardStepper is hidden. */
export function MobileStepProgress({ step }: { step: number }) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className='border-border flex items-center gap-3 border-b px-4 py-2.5 lg:hidden'>
      <div className='flex flex-1 gap-1.5' aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className='bg-border relative h-1 flex-1 overflow-hidden rounded-full'>
            <span
              className={cn(
                'absolute inset-0 origin-left rounded-full bg-emerald-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out',
                i <= step ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </span>
        ))}
      </div>
      <span className='text-muted-foreground grid flex-none text-xs font-medium'>
        {STEPS.map((s, i) => (
          <span
            key={s}
            aria-hidden={i !== step}
            className={cn('col-start-1 row-start-1 text-right whitespace-nowrap', i !== step && 'invisible')}
          >
            {t(`wizard.steps.${s}`)}
          </span>
        ))}
      </span>
    </div>
  );
}
