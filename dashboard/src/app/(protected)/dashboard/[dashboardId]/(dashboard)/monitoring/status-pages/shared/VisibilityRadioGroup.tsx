'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const VISIBILITY_OPTIONS = ['public', 'unlisted'] as const;

export function VisibilityRadioGroup({ className }: { className?: string }) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <div
      role='radiogroup'
      aria-label={t('visibility.title')}
      aria-disabled
      className={cn(
        'border-border bg-card pointer-events-none overflow-hidden rounded-xl border opacity-65',
        className,
      )}
    >
      {VISIBILITY_OPTIONS.map((option, index) => {
        const selected = option === 'public';
        return (
          <div
            key={option}
            className={cn(
              'flex w-full items-start gap-3 px-4 py-3.5 text-left',
              index > 0 && 'border-border border-t',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2',
                selected ? 'border-primary' : 'border-muted-foreground',
              )}
            >
              {selected && <span className='bg-primary h-2 w-2 rounded-full' />}
            </span>
            <span className='min-w-0'>
              <span className='block text-sm font-semibold'>{t(`visibility.${option}`)}</span>
              <span className='text-muted-foreground mt-0.5 block text-xs leading-relaxed'>
                {t(`visibility.${option}Hint`)}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
