'use client';

import { useTranslations } from 'next-intl';
import { Check, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { cn } from '@/lib/utils';
import { type SlugStatus } from './constants';

type SlugFieldProps = {
  id: string;
  value: string;
  onChange: (slug: string) => void;
  publicHost: string;
  slugStatus: SlugStatus;
  /** Optional line under the label (e.g. the General tab's "where your page is published"). */
  hint?: string;
  /** Monospace prefix + input, matching the General tab's URL styling. */
  mono?: boolean;
};

/** Slug input with the host prefix and live availability feedback. */
export function SlugField({ id, value, onChange, publicHost, slugStatus, hint, mono = false }: SlugFieldProps) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{t('publicUrl')}</Label>
      {hint && <p className='text-muted-foreground text-xs'>{hint}</p>}
      <div className='flex items-stretch'>
        <span
          className={cn(
            'border-input bg-muted text-muted-foreground flex max-w-[45%] min-w-0 items-center rounded-l-md border border-r-0 px-3 text-sm',
            mono && 'font-mono',
          )}
        >
          <span className='truncate'>{publicHost}/status/</span>
        </span>
        <div className='relative min-w-0 flex-1'>
          <Input
            id={id}
            value={value}
            maxLength={STATUS_PAGE_LIMITS.SLUG_MAX}
            onChange={(e) => onChange(e.target.value.toLowerCase())}
            className={cn('rounded-l-none pr-9', mono && 'font-mono')}
          />
          <span className='absolute top-1/2 right-2.5 -translate-y-1/2'>
            {slugStatus === 'checking' && (
              <Loader2
                className='text-muted-foreground h-4 w-4 animate-spin'
                aria-label={t('slugStatus.checking')}
              />
            )}
            {slugStatus === 'available' && (
              <Check className='h-4 w-4 text-emerald-500' aria-label={t('slugStatus.available')} />
            )}
            {(slugStatus === 'taken' || slugStatus === 'invalid') && (
              <X className='text-destructive h-4 w-4' aria-label={t(`slugStatus.${slugStatus}`)} />
            )}
          </span>
        </div>
      </div>
      {(slugStatus === 'taken' || slugStatus === 'invalid') && (
        <p className='text-destructive text-xs'>{t(`slugStatus.${slugStatus}`)}</p>
      )}
    </div>
  );
}
