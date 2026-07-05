'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { LabeledTextField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LabeledTextField';
import { VisibilityRadioGroup } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/VisibilityRadioGroup';
import { Section } from './Section';

type GeneralTabProps = {
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  publicHost: string;
  dashboardDomain: string;
  isPublished: boolean;
  savedSlug: string;
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
  savedSlug,
  onUnpublish,
  isUnpublishing,
  onDelete,
  isDeleting,
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
            <div className='space-y-2'>
              <Label htmlFor='sp-slug'>{t('publicUrl')}</Label>
              <p className='text-muted-foreground text-xs'>{t('publicUrlHint')}</p>
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
