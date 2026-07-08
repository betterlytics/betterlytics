'use client';

import { useTranslations } from 'next-intl';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { LabeledTextField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LabeledTextField';
import { VisibilityRadioGroup } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/VisibilityRadioGroup';
import {
  CustomDomainSetup,
  CustomDomainHelpLink,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/CustomDomainSetup';
import { Section } from './Section';

type GeneralTabProps = {
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  publicHost: string;
  dashboardDomain: string;
  isPublished: boolean;
  onUnpublish: () => void;
  isUnpublishing: boolean;
  onDelete: () => void;
  isDeleting: boolean;
};

export function GeneralTab({
  form,
  slugStatus,
  publicHost,
  dashboardDomain,
  isPublished,
  onUnpublish,
  isUnpublishing,
  onDelete,
  isDeleting,
}: GeneralTabProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { caps } = useCapabilities();
  const customDomainLocked = !caps.statusPages.customDomain;

  return (
    <>
      <Section title={t('pageDetails')} description={t('pageDetailsHint')}>
        <div className='bg-card border-border space-y-4 rounded-xl border p-5'>
          <div className='grid gap-4 2xl:grid-cols-2 2xl:items-start'>
            <div className='space-y-2'>
              <Label htmlFor='sp-slug'>{t('publicUrl')}</Label>
              <p className='text-muted-foreground text-xs'>{t('publicUrlHint')}</p>
              <div className='flex items-stretch'>
                <span className='border-input bg-muted text-muted-foreground flex flex-none items-center rounded-l-md border border-r-0 px-3 font-mono text-sm whitespace-nowrap'>
                  {publicHost}/status/
                </span>
                <div className='relative min-w-0 flex-1'>
                  <Input
                    id='sp-slug'
                    value={form.slug}
                    maxLength={STATUS_PAGE_LIMITS.SLUG_MAX}
                    onChange={(e) => form.setSlug(e.target.value.toLowerCase())}
                    className='rounded-l-none pr-9 font-mono'
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
            <CapabilityGate allowed={!customDomainLocked}>
              {({ locked }) => (
                <LabeledTextField
                  id='sp-domain'
                  label={t('customDomain')}
                  labelAdornment={
                    <>
                      {locked && <ProBadge />}
                      <CustomDomainHelpLink />
                    </>
                  }
                  hint={t('customDomainHint')}
                  hintPosition='top'
                  placeholder={`status.${dashboardDomain}`}
                  value={form.customDomain}
                  onChange={form.setCustomDomain}
                  disabled={locked}
                  error={form.isCustomDomainValid ? null : t('customDomainInvalid')}
                />
              )}
            </CapabilityGate>
          </div>
          {!customDomainLocked && (
            <CustomDomainSetup
              customDomain={form.customDomain}
              slug={form.slug}
              publicHost={publicHost}
              isValid={form.isCustomDomainValid}
            />
          )}
        </div>
      </Section>

      <Section title={t('visibility.title')} description={t('visibility.hint')}>
        <VisibilityRadioGroup value={form.visibility} onChange={form.setVisibility} />
      </Section>

      <Section title={t('dangerZone.title')} description={t('dangerZone.hint')}>
        <div className='border-destructive/30 bg-destructive/5 divide-destructive/20 divide-y rounded-xl border'>
          {isPublished && (
            <div className='flex flex-wrap items-center justify-between gap-4 p-5'>
              <p className='text-muted-foreground text-sm'>{t('dangerZone.unpublishDescription')}</p>
              <PermissionGate>
                {(disabled) => (
                  <Button
                    type='button'
                    variant='outline'
                    disabled={disabled || isUnpublishing}
                    onClick={onUnpublish}
                    className='flex-none cursor-pointer'
                  >
                    {t('unpublish')}
                  </Button>
                )}
              </PermissionGate>
            </div>
          )}
          <div className='flex flex-wrap items-center justify-between gap-4 p-5'>
            <p className='text-muted-foreground text-sm'>{t('dangerZone.deleteDescription')}</p>
            <PermissionGate>
              {(disabled) => (
                <Button
                  type='button'
                  variant='destructive'
                  disabled={disabled || isDeleting}
                  onClick={onDelete}
                  className='flex-none cursor-pointer'
                >
                  {t('delete')}
                </Button>
              )}
            </PermissionGate>
          </div>
        </div>
      </Section>
    </>
  );
}
