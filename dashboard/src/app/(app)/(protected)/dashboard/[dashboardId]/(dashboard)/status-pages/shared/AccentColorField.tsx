'use client';

import { useTranslations } from 'next-intl';
import { ColorPickerPopover } from '@/components/ColorPickerPopover';
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { STATUS_PAGE_DEFAULT_ACCENT_COLOR } from '@/entities/analytics/statusPage/statusPage.entities';
import { cn } from '@/lib/utils';
import { ACCENT_PRESETS } from './constants';

type AccentColorFieldProps = {
  /** null = transparent header. */
  value: string | null;
  onChange: (value: string | null) => void;
};

export function AccentColorField({ value, onChange }: AccentColorFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  const isTransparent = value === null;
  return (
    <ColorSwatchPicker
      label={t('accentColor')}
      options={ACCENT_PRESETS.map((preset) => ({ value: preset, hex: preset }))}
      value={value}
      onChange={onChange}
      leading={
        <button
          type='button'
          onClick={() => onChange(null)}
          aria-pressed={isTransparent}
          aria-label={t('accentColorTransparentAria')}
          title={t('accentColorTransparent')}
          className={cn(
            'h-8 w-8 cursor-pointer rounded-full border bg-[repeating-conic-gradient(#d4d4d8_0%_25%,#ffffff_0%_50%)] bg-[length:10px_10px] transition',
            isTransparent ? 'ring-offset-background ring-primary ring-2 ring-offset-2' : 'border-border',
          )}
        />
      }
    >
      <ColorPickerPopover
        value={value ?? STATUS_PAGE_DEFAULT_ACCENT_COLOR}
        onChange={onChange}
        selected={!isTransparent && !ACCENT_PRESETS.includes(value)}
        ariaLabel={t('accentColor')}
      />
    </ColorSwatchPicker>
  );
}
