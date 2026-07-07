'use client';

import { useTranslations } from 'next-intl';
import { Check, Info, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { VisibilityRadioGroup } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/VisibilityRadioGroup';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';

type PublishPanelProps = {
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  publicHost: string;
  domain: string;
};

/**
 * Create-mode only: the act of placing the page (address + visibility). A custom domain is
 * deliberately absent: its DNS lifecycle cannot even start before the page exists, so it
 * lives in page settings, and this tab only points there.
 */
export function PublishPanel({ form, slugStatus, publicHost, domain }: PublishPanelProps) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <div className='space-y-8'>
      <div className='space-y-2'>
        <Label htmlFor='studio-slug'>{t('publicUrl')}</Label>
        <div className='flex items-center gap-1.5'>
          <div className='flex min-w-0 flex-1 items-stretch'>
            <span className='border-input bg-muted text-muted-foreground flex max-w-[45%] min-w-0 items-center rounded-l-md border border-r-0 px-3 text-sm'>
              <span className='truncate'>{publicHost}/status/</span>
            </span>
            <div className='relative min-w-0 flex-1'>
              <Input
                id='studio-slug'
                value={form.slug}
                maxLength={STATUS_PAGE_LIMITS.SLUG_MAX}
                onChange={(e) => form.setSlug(e.target.value.toLowerCase())}
                className='rounded-l-none pr-9'
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
        </div>
        {(slugStatus === 'taken' || slugStatus === 'invalid') && (
          <p className='text-destructive text-xs'>{t(`slugStatus.${slugStatus}`)}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label>{t('visibility.title')}</Label>
        <VisibilityRadioGroup value={form.visibility} onChange={form.setVisibility} />
      </div>

      <div className='border-border bg-muted/40 text-muted-foreground flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-relaxed'>
        <Info className='mt-0.5 h-3.5 w-3.5 flex-none' aria-hidden />
        <span>{t('studio.customDomainLater', { domain })}</span>
      </div>
    </div>
  );
}
