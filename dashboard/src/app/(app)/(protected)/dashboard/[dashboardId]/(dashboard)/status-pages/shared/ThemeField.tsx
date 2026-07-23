'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { type StatusPageTheme } from '@/entities/analytics/statusPage/statusPage.entities';
import { ThemeSegmentedControl } from './ThemeSegmentedControl';

type ThemeFieldProps = {
  value: StatusPageTheme;
  onChange: (theme: StatusPageTheme) => void;
  hint?: string;
};

export function ThemeField({ value, onChange, hint }: ThemeFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className='space-y-2'>
      <div className='space-y-0.5'>
        <Label>{t('theme')}</Label>
        {hint && <p className='text-muted-foreground text-xs'>{hint}</p>}
      </div>
      <ThemeSegmentedControl value={value} onChange={onChange} />
    </div>
  );
}
