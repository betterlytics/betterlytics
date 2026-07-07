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
  /** Optional line under the label, e.g. clarifying the theme applies to visitors, not this editor. */
  hint?: string;
};

export function ThemeField({ value, onChange, layout = 'stacked', hint }: ThemeFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className={cn(layout === 'row' ? 'flex items-center justify-between gap-4' : 'space-y-2')}>
      <div className={cn(layout === 'stacked' && 'space-y-0.5')}>
        <Label>{t('theme')}</Label>
        {hint && <p className='text-muted-foreground text-xs'>{hint}</p>}
      </div>
      <ThemeSegmentedControl value={value} onChange={onChange} />
    </div>
  );
}
