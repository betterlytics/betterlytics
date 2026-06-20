'use client';

import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
import { type StatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';
import { ImageUploadField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/ImageUploadField';
import { AccentColorField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/AccentColorField';
import { ThemeField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/ThemeField';
import { Section } from './Section';

type CustomizeTabProps = {
  form: StatusPageFormState;
};

/** Branding (logo + favicon + accent) and appearance (theme) tab. */
export function CustomizeTab({ form }: CustomizeTabProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { caps } = useCapabilities();
  const brandingLocked = !caps.statusPages.removeBranding;

  return (
    <>
      <Section title={t('branding')} description={t('brandHint')}>
        <div className='bg-card border-border space-y-5 rounded-xl border p-5'>
          <div className='flex flex-wrap items-start gap-4'>
            <ImageUploadField
              kind='logo'
              value={form.logoUrl}
              onSelect={form.stageLogo}
              onRemove={form.removeLogo}
            />
            <ImageUploadField
              kind='favicon'
              value={form.faviconUrl}
              onSelect={form.stageFavicon}
              onRemove={form.removeFavicon}
            />
          </div>
          <AccentColorField value={form.accentColor} onChange={form.setAccentColor} />
          <div className='border-border flex items-center justify-between gap-4 border-t pt-5'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>{t('hideBranding')}</span>
                {brandingLocked && <ProBadge />}
              </div>
              <p className='text-muted-foreground mt-0.5 text-xs'>{t('hideBrandingHint')}</p>
            </div>
            <CapabilityGate allowed={!brandingLocked}>
              {({ locked }) => (
                <Switch
                  checked={form.hideBranding}
                  onCheckedChange={(value) => {
                    if (locked) return;
                    form.setHideBranding(value);
                  }}
                  disabled={locked}
                  aria-label={t('hideBranding')}
                />
              )}
            </CapabilityGate>
          </div>
        </div>
      </Section>

      <Section title={t('appearance')} description={t('appearanceHint')}>
        <div className='bg-card border-border rounded-xl border p-5'>
          <ThemeField value={form.theme} onChange={form.setTheme} />
        </div>
      </Section>
    </>
  );
}
