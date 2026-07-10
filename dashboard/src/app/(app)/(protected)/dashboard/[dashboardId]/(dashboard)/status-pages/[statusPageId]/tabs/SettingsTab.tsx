'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { SlugField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/SlugField';
import { LabeledTextField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LabeledTextField';
import { VisibilityRadioGroup } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/VisibilityRadioGroup';
import {
  CustomDomainSetup,
  CustomDomainHelpLink,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/CustomDomainSetup';
import { Section } from './Section';

type SettingsTabProps = {
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

export function SettingsTab({
  form,
  slugStatus,
  publicHost,
  dashboardDomain,
  isPublished,
  onUnpublish,
  isUnpublishing,
  onDelete,
  isDeleting,
}: SettingsTabProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { caps } = useCapabilities();
  const customDomainLocked = !caps.statusPages.customDomain;

  return (
    <>
      <Section title={t('publicAddress')}>
        <div className='bg-card border-border space-y-4 rounded-xl border p-5'>
          <div className='grid gap-4 2xl:grid-cols-2 2xl:items-start'>
            <SlugField
              id='sp-slug'
              value={form.slug}
              onChange={(slug) => form.patch({ slug })}
              publicHost={publicHost}
              slugStatus={slugStatus}
              hint={t('publicUrlHint')}
              mono
            />
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
                  onChange={(customDomain) => form.patch({ customDomain })}
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

      <Section title={t('visibility.title')}>
        <VisibilityRadioGroup value={form.visibility} onChange={(visibility) => form.patch({ visibility })} />
      </Section>

      <Section title={t('dangerZone.title')}>
        <div className='border-destructive/30 bg-destructive/5 divide-destructive/20 divide-y rounded-xl border'>
          {isPublished && (
            <div className='flex flex-wrap items-center justify-between gap-4 p-5'>
              <p className='text-muted-foreground text-sm'>{t('dangerZone.unpublishDescription')}</p>
              <PermissionGate permission='canPublishStatusPages'>
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
            <PermissionGate permission='canDeleteStatusPages'>
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
