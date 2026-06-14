'use client';

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { type StatusPageTheme } from '@/entities/analytics/statusPage.entities';

const THEME_OPTIONS: { value: StatusPageTheme; Icon: LucideIcon }[] = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
];

type ThemeSegmentedControlProps = {
  value: StatusPageTheme;
  onChange: (theme: StatusPageTheme) => void;
};

export function ThemeSegmentedControl({ value, onChange }: ThemeSegmentedControlProps) {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <div className='border-input inline-flex overflow-hidden rounded-md border'>
      {THEME_OPTIONS.map(({ value: option, Icon }) => (
        <button
          key={option}
          type='button'
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 px-3.5 py-1.5 text-sm transition-colors',
            value === option
              ? 'bg-secondary font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className='h-3.5 w-3.5' aria-hidden />
          {t(`themes.${option}`)}
        </button>
      ))}
    </div>
  );
}
