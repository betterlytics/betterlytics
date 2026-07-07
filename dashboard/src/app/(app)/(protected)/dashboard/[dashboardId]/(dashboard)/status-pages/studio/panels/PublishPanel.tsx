'use client';

import { useTranslations } from 'next-intl';
import { Check, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { LabeledTextField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LabeledTextField';
import { VisibilityRadioGroup } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/VisibilityRadioGroup';
import {
  CustomDomainSetup,
  CustomDomainHelpLink,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/CustomDomainSetup';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';

type PublishPanelProps = {
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  publicHost: string;
  domain: string;
};

/**
 * Create-mode only: the act of placing the page (address, visibility, optional domain).
 * Post-create these become lifecycle settings on the detail page — edit mode drops this tab.
 */
export function PublishPanel({ form, slugStatus, publicHost, domain }: PublishPanelProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { caps } = useCapabilities();
  const customDomainLocked = !caps.statusPages.customDomain;

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

      <CapabilityGate allowed={!customDomainLocked}>
        {({ locked }) => (
          <LabeledTextField
            id='studio-domain'
            label={t('customDomain')}
            labelAdornment={
              <>
                {locked && <ProBadge />}
                <CustomDomainHelpLink />
              </>
            }
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

      {!customDomainLocked && (
        <CustomDomainSetup
          customDomain={form.customDomain}
          slug={form.slug}
          publicHost={publicHost}
          isValid={form.isCustomDomainValid}
        />
      )}

      {!customDomainLocked && <p className='text-muted-foreground text-xs'>{t('studio.domainAfterCreate')}</p>}
    </div>
  );
}
