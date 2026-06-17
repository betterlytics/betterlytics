'use client';

import { useTranslations } from 'next-intl';
import { type StatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';
import { LogoUploadField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/LogoUploadField';
import { AccentColorField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/AccentColorField';
import { ThemeField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/ThemeField';
import { Section } from './Section';

type CustomizeTabProps = {
  form: StatusPageFormState;
  dashboardId: string;
  statusPageId: string;
};

/** Branding (logo + accent) and appearance (theme) tab. */
export function CustomizeTab({ form, dashboardId, statusPageId }: CustomizeTabProps) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <>
      <Section title={t('branding')} description={t('brandHint')}>
        <div className='bg-card border-border space-y-5 rounded-xl border p-5'>
          <LogoUploadField
            dashboardId={dashboardId}
            statusPageId={statusPageId}
            logoUrl={form.logoUrl}
            onLogoChange={form.setLogoUrl}
          />
          <AccentColorField value={form.accentColor} onChange={form.setAccentColor} />
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
