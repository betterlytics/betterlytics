'use client';

import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { SlugField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/SlugField';
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
      <SlugField
        id='studio-slug'
        value={form.slug}
        onChange={form.setSlug}
        publicHost={publicHost}
        slugStatus={slugStatus}
      />

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
