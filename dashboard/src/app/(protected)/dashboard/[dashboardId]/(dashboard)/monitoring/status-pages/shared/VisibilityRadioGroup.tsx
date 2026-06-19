'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { type StatusPageVisibility } from '@/entities/analytics/statusPage.entities';

const VISIBILITY_OPTIONS: StatusPageVisibility[] = ['public', 'unlisted'];

type VisibilityRadioGroupProps = {
  value: StatusPageVisibility;
  onChange: (value: StatusPageVisibility) => void;
  className?: string;
};

export function VisibilityRadioGroup({ value, onChange, className }: VisibilityRadioGroupProps) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <div
      role='radiogroup'
      aria-label={t('visibility.title')}
      className={cn('border-border bg-card overflow-hidden rounded-xl border', className)}
    >
      {VISIBILITY_OPTIONS.map((option, index) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type='button'
            role='radio'
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={cn(
              'hover:bg-muted/40 flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition-colors',
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
          </button>
        );
      })}
    </div>
  );
}
