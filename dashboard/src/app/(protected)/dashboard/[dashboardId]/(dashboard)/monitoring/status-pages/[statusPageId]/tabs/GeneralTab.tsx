'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage.entities';
import { type SlugStatus } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/constants';
import { type StatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';
import { LabeledTextField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/LabeledTextField';
import { VisibilityRadioGroup } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/VisibilityRadioGroup';
import { Section } from './Section';

type GeneralTabProps = {
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  publicHost: string;
  dashboardDomain: string;
  isPublished: boolean;
  savedSlug: string;
};

export function GeneralTab({
  form,
  slugStatus,
  publicHost,
  dashboardDomain,
  isPublished,
  savedSlug,
}: GeneralTabProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { caps } = useCapabilities();
  const customDomainLocked = !caps.statusPages.customDomain;

  const slugStatusLabel =
    slugStatus === 'idle' ? null : (
      <span
        className={
          slugStatus === 'available'
            ? 'text-emerald-600 dark:text-emerald-400'
            : slugStatus === 'checking'
              ? 'text-muted-foreground'
              : 'text-destructive'
        }
      >
        {t(`slugStatus.${slugStatus}`)}
      </span>
    );

  return (
    <>
      <Section title={t('pageDetails')} description={t('pageDetailsHint')}>
        <div className='bg-card border-border space-y-4 rounded-xl border p-5'>
          <div className='grid gap-4 2xl:grid-cols-2 2xl:items-start'>
            <div className='space-y-2'>
              <Label htmlFor='sp-name'>{t('pageName')}</Label>
              <Input
                id='sp-name'
                value={form.name}
                maxLength={STATUS_PAGE_LIMITS.NAME_MAX}
                aria-invalid={form.isNameEmpty}
                onChange={(e) => form.setName(e.target.value)}
              />
              {form.isNameEmpty && <p className='text-destructive text-xs'>{t('nameRequired')}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='sp-slug'>{t('publicUrl')}</Label>
              <div className='flex items-stretch'>
                <span className='border-input bg-muted text-muted-foreground flex flex-none items-center rounded-l-md border border-r-0 px-3 font-mono text-sm whitespace-nowrap'>
                  {publicHost}/status/
                </span>
                <Input
                  id='sp-slug'
                  value={form.slug}
                  maxLength={STATUS_PAGE_LIMITS.SLUG_MAX}
                  onChange={(e) => form.setSlug(e.target.value.toLowerCase())}
                  className='min-w-0 flex-1 rounded-l-none font-mono'
                />
              </div>
              <div className='flex justify-between text-xs'>
                {isPublished && form.slug !== savedSlug ? (
                  <span className='text-amber-600 dark:text-amber-400'>{t('slugWarning')}</span>
                ) : (
                  <span />
                )}
                {slugStatusLabel}
              </div>
            </div>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <LabeledTextField
              id='sp-homepage'
              label={t('homepageUrl')}
              hint={t('homepageUrlHint')}
              placeholder='https://example.com'
              type='url'
              value={form.homepageUrl}
              onChange={form.setHomepageUrl}
              error={form.isHomepageUrlValid ? null : t('homepageUrlInvalid')}
            />
            <CapabilityGate allowed={!customDomainLocked}>
              {({ locked }) => (
                <LabeledTextField
                  id='sp-domain'
                  label={t('customDomain')}
                  labelAdornment={locked ? <ProBadge /> : undefined}
                  hint={t('customDomainHint')}
                  placeholder={`status.${dashboardDomain}`}
                  value={form.customDomain}
                  onChange={form.setCustomDomain}
                  disabled={locked}
                  error={form.isCustomDomainValid ? null : t('customDomainInvalid')}
                />
              )}
            </CapabilityGate>
          </div>
          <div className='border-border flex items-center justify-between gap-4 border-t pt-4'>
            <div>
              <div className='text-sm font-medium'>{t('showPastIncidents')}</div>
              <p className='text-muted-foreground mt-0.5 text-xs'>{t('showPastIncidentsHint')}</p>
            </div>
            <Switch
              checked={form.showPastIncidents}
              onCheckedChange={form.setShowPastIncidents}
              aria-label={t('showPastIncidents')}
            />
          </div>
        </div>
      </Section>

      <Section title={t('visibility.title')} description={t('visibility.hint')}>
        <VisibilityRadioGroup value={form.visibility} onChange={form.setVisibility} />
      </Section>
    </>
  );
}
