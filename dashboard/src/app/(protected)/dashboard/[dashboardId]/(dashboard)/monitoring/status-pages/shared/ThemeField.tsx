'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { type StatusPageTheme } from '@/entities/analytics/statusPage.entities';
import { ThemeSegmentedControl } from './ThemeSegmentedControl';

type ThemeFieldProps = {
  value: StatusPageTheme;
  onChange: (theme: StatusPageTheme) => void;
};

export function ThemeField({ value, onChange }: ThemeFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className='space-y-2'>
      <Label>{t('theme')}</Label>
      <ThemeSegmentedControl value={value} onChange={onChange} />
    </div>
  );
}
