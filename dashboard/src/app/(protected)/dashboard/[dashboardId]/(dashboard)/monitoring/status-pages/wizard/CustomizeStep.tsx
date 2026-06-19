'use client';

import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SortableList } from '@/components/dnd/SortableList';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage.entities';
import { AccentColorField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/AccentColorField';
import { ThemeField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/ThemeField';
import { LabeledTextField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/LabeledTextField';
import { SortableNameRow } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/SortableNameRow';
import { type StatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';

type CustomizeStepProps = {
  form: StatusPageFormState;
};

export function CustomizeStep({ form }: CustomizeStepProps) {
  const t = useTranslations('statusPagesPage.editor');
  const includedRows = form.monitorRows.filter((row) => row.included);
  const excludedRows = form.monitorRows.filter((row) => !row.included);

  return (
    <div className='space-y-7'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold'>{t('wizard.customize.heading')}</h2>
        <p className='text-muted-foreground text-sm'>{t('wizard.customize.description')}</p>
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='wiz-name'>{t('pageName')}</Label>
        <Input
          id='wiz-name'
          value={form.name}
          maxLength={STATUS_PAGE_LIMITS.NAME_MAX}
          aria-invalid={form.isNameEmpty}
          onChange={(e) => form.setName(e.target.value)}
        />
        {form.isNameEmpty && <p className='text-destructive text-xs'>{t('nameRequired')}</p>}
      </div>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-start gap-4'>
          <div className='space-y-2'>
            <Label>{t('logo')}</Label>
            <button
              type='button'
              className='border-input text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground flex h-16 w-36 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed text-xs transition-colors'
            >
              <Upload className='h-3.5 w-3.5' />
              {t('uploadLogo')}
            </button>
          </div>
          <div className='space-y-2'>
            <Label>{t('favicon')}</Label>
            <button
              type='button'
              aria-label={t('uploadFavicon')}
              title={t('uploadFavicon')}
              className='border-input text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed transition-colors'
            >
              <Upload className='h-4 w-4' />
            </button>
          </div>
        </div>
        <AccentColorField value={form.accentColor} onChange={form.setAccentColor} />
        <ThemeField value={form.theme} onChange={form.setTheme} />
      </div>

      <LabeledTextField
        id='wiz-homepage'
        label={t('homepageUrl')}
        hint={t('homepageUrlHint')}
        placeholder='https://example.com'
        type='url'
        hintPosition='top'
        value={form.homepageUrl}
        onChange={form.setHomepageUrl}
        error={form.isHomepageUrlValid ? null : t('homepageUrlInvalid')}
      />

      <div className='flex items-center justify-between gap-4'>
        <div className='min-w-0 space-y-0.5'>
          <Label htmlFor='wiz-incidents' className='cursor-pointer'>
            {t('showPastIncidents')}
          </Label>
          <p className='text-muted-foreground text-xs'>{t('showPastIncidentsHint')}</p>
        </div>
        <Switch
          id='wiz-incidents'
          checked={form.showPastIncidents}
          onCheckedChange={form.setShowPastIncidents}
          className='flex-none'
        />
      </div>

      {includedRows.length > 0 && (
        <div className='space-y-2'>
          <div className='flex items-baseline justify-between'>
            <Label>{t('wizard.publicNames')}</Label>
            <span className='text-muted-foreground text-xs'>{t('wizard.dragReorder')}</span>
          </div>
          <SortableList
            items={includedRows}
            getId={(row) => row.monitorCheckId}
            onReorder={(next) => form.setMonitorRows([...next, ...excludedRows])}
            className='space-y-2'
          >
            {includedRows.map((row) => (
              <SortableNameRow
                key={row.monitorCheckId}
                row={row}
                onPublicNameChange={(publicName) =>
                  form.updateRow(
                    form.monitorRows.findIndex((r) => r.monitorCheckId === row.monitorCheckId),
                    { publicName },
                  )
                }
              />
            ))}
          </SortableList>
        </div>
      )}
    </div>
  );
}
