'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { AccentColorField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/AccentColorField';
import { ThemeField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/ThemeField';
import { LabeledTextField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LabeledTextField';
import { ImageUploadField } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/ImageUploadField';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';

type BrandingPanelProps = {
  form: StatusPageFormState;
};

/** Identity + look of the page: everything here is previewable content. Name leads (identity cluster). */
export function BrandingPanel({ form }: BrandingPanelProps) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <div className='space-y-8'>
      <div className='space-y-1.5'>
        <Label htmlFor='studio-name'>{t('pageName')}</Label>
        <p className='text-muted-foreground text-xs'>{t('studio.pageNameHint')}</p>
        <Input
          id='studio-name'
          value={form.name}
          maxLength={STATUS_PAGE_LIMITS.NAME_MAX}
          aria-invalid={form.isNameEmpty}
          onChange={(e) => form.setName(e.target.value)}
        />
        {form.isNameEmpty && <p className='text-destructive text-xs'>{t('nameRequired')}</p>}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <ImageUploadField
          kind='logo'
          variant='tile'
          value={form.logoUrl}
          onSelect={form.stageLogo}
          onRemove={form.removeLogo}
        />
        <ImageUploadField
          kind='favicon'
          variant='tile'
          value={form.faviconUrl}
          onSelect={form.stageFavicon}
          onRemove={form.removeFavicon}
        />
      </div>

      <AccentColorField value={form.accentColor} onChange={form.setAccentColor} />
      <ThemeField value={form.theme} onChange={form.setTheme} hint={t('studio.themeHint')} />

      <LabeledTextField
        id='studio-homepage'
        label={t('homepageUrl')}
        hint={t('homepageUrlHint')}
        placeholder='https://example.com'
        type='url'
        hintPosition='top'
        value={form.homepageUrl}
        onChange={form.setHomepageUrl}
        error={form.isHomepageUrlValid ? null : t('homepageUrlInvalid')}
      />

      {/* Divider: identity/appearance above, page-behavior below. */}
      <div className='border-border flex items-center justify-between gap-4 border-t pt-6'>
        <div className='min-w-0 space-y-0.5'>
          <Label htmlFor='studio-incidents' className='cursor-pointer'>
            {t('showPastIncidents')}
          </Label>
          <p className='text-muted-foreground text-xs'>{t('showPastIncidentsHint')}</p>
        </div>
        <Switch
          id='studio-incidents'
          checked={form.showPastIncidents}
          onCheckedChange={form.setShowPastIncidents}
          className='flex-none'
        />
      </div>
    </div>
  );
}
