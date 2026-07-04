'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { type StatusPageTheme } from '@/entities/analytics/statusPage/statusPage.entities';
import { ThemeSegmentedControl } from './ThemeSegmentedControl';

type ThemeFieldProps = {
  value: StatusPageTheme;
  onChange: (theme: StatusPageTheme) => void;
  layout?: 'row' | 'stacked';
};

export function ThemeField({ value, onChange, layout = 'stacked' }: ThemeFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className={cn(layout === 'row' ? 'flex items-center justify-between gap-4' : 'space-y-2')}>
      <Label>{t('theme')}</Label>
      <ThemeSegmentedControl value={value} onChange={onChange} />
    </div>
  );
}
