'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { LabeledTextField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LabeledTextField';
import { VisibilityRadioGroup } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/VisibilityRadioGroup';
import { Section } from './Section';

type GeneralTabProps = {
  form: StatusPageFormState;
  dashboardDomain: string;
};

export function GeneralTab({ form, dashboardDomain }: GeneralTabProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { caps } = useCapabilities();
  const customDomainLocked = !caps.statusPages.customDomain;

  return (
    <>
      <Section title={t('pageDetails')} description={t('pageDetailsHint')}>
        <div className='bg-card border-border space-y-4 rounded-xl border p-5'>
          <div className='space-y-2'>
            <Label htmlFor='sp-name'>{t('pageName')}</Label>
            <p className='text-muted-foreground text-xs'>{t('pageNameHint')}</p>
            <Input
              id='sp-name'
              value={form.name}
              maxLength={STATUS_PAGE_LIMITS.NAME_MAX}
              aria-invalid={form.isNameEmpty}
              onChange={(e) => form.setName(e.target.value)}
            />
            {form.isNameEmpty && <p className='text-destructive text-xs'>{t('nameRequired')}</p>}
          </div>
          <div className='grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2'>
            <LabeledTextField
              id='sp-homepage'
              label={t('homepageUrl')}
              hint={t('homepageUrlHint')}
              hintPosition='top'
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
