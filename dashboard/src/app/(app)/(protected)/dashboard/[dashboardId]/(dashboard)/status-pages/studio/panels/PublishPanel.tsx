'use client';

import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
        onChange={(slug) => form.patch({ slug })}
        publicHost={publicHost}
        slugStatus={slugStatus}
      />

      <div className='space-y-2'>
        <Label>{t('visibility.title')}</Label>
        <VisibilityRadioGroup value={form.visibility} onChange={(visibility) => form.patch({ visibility })} />
      </div>

      <Alert variant='neutral'>
        <AlertDescription>{t('studio.customDomainLater', { domain })}</AlertDescription>
      </Alert>
    </div>
  );
}
