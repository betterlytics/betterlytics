'use client';

import { useTranslations } from 'next-intl';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { type SlugStatus } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/constants';
import { LabeledTextField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/LabeledTextField';
import { VisibilityRadioGroup } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/VisibilityRadioGroup';
import { type StatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';

type PublishStepProps = {
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  publicHost: string;
  publicBaseUrl: string;
  domain: string;
};

export function PublishStep({ form, slugStatus, publicHost, publicBaseUrl, domain }: PublishStepProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { caps } = useCapabilities();
  const customDomainLocked = !caps.statusPages.customDomain;

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold'>{t('wizard.publish.heading')}</h2>
        <p className='text-muted-foreground text-sm'>{t('wizard.publish.description')}</p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='wiz-slug'>{t('publicUrl')}</Label>
        <div className='flex items-center gap-1.5'>
          <div className='flex min-w-0 flex-1 items-stretch'>
            <span className='border-input bg-muted text-muted-foreground flex max-w-[45%] min-w-0 items-center rounded-l-md border border-r-0 px-3 text-sm'>
              <span className='truncate'>{publicHost}/status/</span>
            </span>
            <div className='relative min-w-0 flex-1'>
              <Input
                id='wiz-slug'
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
          <button
            type='button'
            onClick={() => {
              navigator.clipboard.writeText(`${publicBaseUrl}/status/${form.slug}`);
              toast.success(t('publishSuccess.copied'));
            }}
            aria-label={t('publishSuccess.copy')}
            title={t('publishSuccess.copy')}
            className='text-muted-foreground hover:text-foreground hover:bg-muted flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-md transition-colors'
          >
            <Copy className='h-4 w-4' />
          </button>
        </div>
        {(slugStatus === 'taken' || slugStatus === 'invalid') && (
          <p className='text-destructive text-xs'>{t(`slugStatus.${slugStatus}`)}</p>
        )}
      </div>

      <CapabilityGate allowed={!customDomainLocked}>
        {({ locked }) => (
          <LabeledTextField
            id='wiz-domain'
            label={t('customDomain')}
            labelAdornment={locked ? <ProBadge /> : undefined}
            hint={t('customDomainHint')}
            placeholder={`status.${domain}`}
            hintPosition='top'
            value={form.customDomain}
            onChange={form.setCustomDomain}
            disabled={locked}
            error={form.isCustomDomainValid ? null : t('customDomainInvalid')}
          />
        )}
      </CapabilityGate>

      <div className='space-y-2'>
        <Label>{t('visibility.title')}</Label>
        <VisibilityRadioGroup value={form.visibility} onChange={form.setVisibility} />
      </div>
    </div>
  );
}
